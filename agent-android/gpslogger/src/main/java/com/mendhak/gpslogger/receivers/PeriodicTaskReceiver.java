package com.mendhak.gpslogger.receivers;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.os.AsyncTask;
import android.os.Build;
import com.mendhak.gpslogger.GpsLoggingService;
import com.mendhak.gpslogger.Manager.ReportInfoManager;
import com.mendhak.gpslogger.common.PreferenceHelper;
import com.mendhak.gpslogger.common.Session;
import com.mendhak.gpslogger.common.Strings;
import com.mendhak.gpslogger.common.Systems;
import com.mendhak.gpslogger.common.events.CommandEvents;
import com.mendhak.gpslogger.common.slf4j.Logs;
import com.mendhak.gpslogger.model.Sample;
import de.greenrobot.event.EventBus;
import okhttp3.*;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Created with IntelliJ IDEA. User: ning.chen Date: 3/22/16 To change this template use File | Settings | File Templates.
 */
public class PeriodicTaskReceiver extends BroadcastReceiver {
    private static final String INTENT_ACTION_REPORT = "REPORT_gps_location_samples";
    private static final Logger LOG = Logs.of(PeriodicTaskReceiver.class);

    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");
    private OkHttpClient httpclient;

    /**
     * We can gather sample at 5 seconds minimum, we try to cache at most 1 minutes data (so it is 12 slots) We report either the cache is full or we
     * have reached the report interval
     */
    private final static int _SLOT_NUM = 60;
    private final List<Sample> _samples = new ArrayList<Sample>(_SLOT_NUM);

    private boolean _ssl = false;
    private String _endpoint;
    private String _appKey;
    private long _reportInterval;
    private long _lastReportEpoch = System.currentTimeMillis();
    private GpsLoggingService _logginService;
    private Intent alarmIntent;

    public PeriodicTaskReceiver(GpsLoggingService logginService) {
        _logginService = logginService;
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (!Strings.isNullOrEmpty(intent.getAction())) {
            if (intent.getAction().equals("android.intent.action.BATTERY_LOW")) {
                // TODO ...
            } else if (intent.getAction().equals("android.intent.action.BATTERY_OKAY")) {
                // TODO ...
            } else if (intent.getAction().equals(INTENT_ACTION_REPORT)) {
                LOG.info(String.format("Reporter timer expires. Try reporting %d samples back to server ...", _samples.size()));
                //                tryReportData();
                EventBus.getDefault().postSticky(new CommandEvents.Report());
            }
        }
    }

    public void collectLocationSample() {
        Sample sample = _gatherSample(System.currentTimeMillis());
        _samples.add(sample);

        // # of points not reported
        Session.setNumLegs(_samples.size());

        if (_samples.size() >= (_SLOT_NUM * 2)) {
            LOG.warn("Too many samples have been gathered. Force reporting back to server ...");
            tryReportData();
        }
    }

    public void initialize() {
        updateConfigParams();

        OkHttpClient.Builder builder = new OkHttpClient.Builder();
        builder.connectTimeout(30, TimeUnit.SECONDS);
        builder.readTimeout(30, TimeUnit.SECONDS);
        builder.writeTimeout(30, TimeUnit.SECONDS);

        this.httpclient = builder.build();

        LOG.info("Initializing periodic task for reporting GPS data with end point - " + this._endpoint);
    }

    public void updateConfigParams() {
        PreferenceHelper preferenceHelper = PreferenceHelper.getInstance();
        this._reportInterval = preferenceHelper.getMobileTrackingReportInterval() * 1000;
        this._ssl = preferenceHelper.getMobileTrackingUseSSL();
        this._endpoint = preferenceHelper.getMobileTrackingEndpoint();
        this._appKey = preferenceHelper.getMobileTrackingAppKey();

        LOG.info("_endpoint:" + _endpoint + ",_appKey:" + _appKey + ",_ssl:" + _ssl + ",_reportInterval:" + _reportInterval);
    }

    /**
     * Start the periodic alarm if not already been started up yet
     */
    public void startReportTimer() {
        long triggerTime = System.currentTimeMillis() + _reportInterval;

        alarmIntent = new Intent(_logginService, PeriodicTaskReceiver.class);
        cancelAlarm();

        PendingIntent sender = PendingIntent.getBroadcast(_logginService, 0, alarmIntent, PendingIntent.FLAG_UPDATE_CURRENT);
        AlarmManager am = (AlarmManager) _logginService.getSystemService(Context.ALARM_SERVICE);
        if (Systems.isDozing(_logginService)) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, sender);
            }
        } else {
            am.set(AlarmManager.RTC_WAKEUP, triggerTime, sender);
        }
        LOG.debug("report timer has been set");
    }

    /**
     * Stop the periodic alarm
     */
    public void stopReportTimer() {
        LOG.info("GPS logging is disabled. Stop reporting timer ...");

        tryReportData();

        cancelAlarm();
    }


    /**
     * Gather one sample
     */
    private Sample _gatherSample(long curTime) {
        Location location = Session.getCurrentLocationInfo();

        if (location == null) {
            LOG.debug("Found invalid current location for sample - " + curTime);

            return new Sample(curTime);
        } else {
            /*
            LOG.debug(String.format("Has valid current location for sample - %d: (lat=%.2f, lng=%.2f, alt=%.2f, acc=%.2f)", curTime, location
                    .getLatitude(), location.getLongitude(), location.getAltitude(), location.getAccuracy()));
            */
            return new Sample(curTime, location.getLatitude(), location.getLongitude(), location.getAltitude(), location.getSpeed(), location
                    .getBearing(), location.getAccuracy());
        }
    }

    /**
     * Report GPS Data We report data to make sure samples in sets of 4 (as each minute contains 4 samples)
     *
     * If there are more data than required, we would just keep them in cache to wait next time for the reporting
     */
    private void _reportGpsData(JSONObject data) throws Exception {
        String retString;

        String path;

        if (_ssl) {
            path = String.format("https://%s/rest/data/%s", _endpoint, _appKey);
        } else {
            path = String.format("http://%s/rest/data/%s", _endpoint, _appKey);
        }

        LOG.debug("Try reporting with path - " + path);

        RequestBody body = RequestBody.create(JSON, data.toString());
        Request post = new Request.Builder().url(path)
                // .addHeader("connection", "close")
                .post(body).build();

        Response res = httpclient.newCall(post).execute();


        retString = res.body().string();
        ReportInfoManager.stance.mCode = res.code();
        if (200 != res.code()) {
            LOG.warn("Reporting get HTTP code - " + res.code() + " and payload:\n" + retString);

            ReportInfoManager.stance.setMessage(String.format("Reporting is fail! Http code: %s and the message: %s", res.code(), res.message()));
            throw new Exception(String.format("Reporting is successful, and payload:\n" + retString));
        } else {
            ReportInfoManager.stance.setMessage(String.format("Reporting is successful, and payload:\n" + retString));

            // LOG.debug("Reporting get HTTP code - " + res.code() + " and payload:\n" + retString);
        }

        // LOG.info("Receive response - " + retString);
        try {
            if (new JSONObject(retString).getBoolean("u")) {
                loadConf();
            }
        } catch (Exception e) {
            //Do nothing!
        }
    }

    /**
     * init submitting data by creating the JSON object to be reported
     *
     * { status: 200, message: "OK", data: [{ timestamp: xxxx, metrics: [{ name: metric1, value: 123 }, { name: metric2, value: 456 }] }, { timestamp:
     * xxxx, metrics: [{ name: metric1, value: 123 }, { name: metric2, value: 456 }] }] }
     */
    private JSONObject _composePayload() {
        JSONObject submitData = new JSONObject();
        JSONArray samples = new JSONArray();
        try {
            submitData.put("status", 200);
            submitData.put("message", "OK");
            submitData.put("data", samples);

            for (Sample sample : _samples) {
                JSONObject tmp = new JSONObject();
                samples.put(tmp);

                tmp.put("timestamp", sample.epoch);
                tmp.put("metrics", _toMetrics(sample));
            }

            _samples.clear();
        } catch (Exception e) {
            LOG.error("Cannot create data to post - " + e.getMessage(), e);
        }

        // LOG.info("Try reporting JSON - " + submitData);

        return submitData;
    }

    private JSONArray _toMetrics(Sample sample) throws JSONException {
        JSONArray metrics = new JSONArray();

        // Notice: it is possible for values to be NaN and JSON won't accept NaN
        // for such cases, we just leave the "value" property be omitted
        JSONObject lat = new JSONObject();
        lat.put("name", "latitude");
        if (!Double.isNaN(sample.lat)) {
            lat.put("value", sample.lat);
        }
        metrics.put(lat);

        JSONObject lng = new JSONObject();
        lng.put("name", "longitude");
        if (!Double.isNaN(sample.lng)) {
            lng.put("value", sample.lng);
        }
        metrics.put(lng);

        JSONObject alt = new JSONObject();
        alt.put("name", "altitude");
        if (!Double.isNaN(sample.alt)) {
            alt.put("value", sample.alt);
        }
        metrics.put(alt);

        JSONObject acc = new JSONObject();
        acc.put("name", "accuracy");
        if (!Double.isNaN(sample.accuracy)) {
            acc.put("value", sample.accuracy);
        }
        metrics.put(acc);

        return metrics;
    }

    /**
     * TODO
     */
    private void loadConf() {
        /*
        String path = String.format("https://%s/santaba/api/getMobileConf?c=%s&h=%s&k=%s", _endpoint, _type, _user, _app);
        LOG.debug("Try get configuration from - " + path);

        try{
            Request request = new Request.Builder().url(path).build();
            Response res = httpclient.newCall(request).execute();
            if (200 == res.code()) {
                String retString = res.body().string();
                JSONObject jsonObject = (JSONObject) (new JSONObject(retString).getJSONArray("m").opt(0));
                int gatherInterval = jsonObject.getInt("i");
                int submitInterval = new JSONObject(retString).getInt("i");
                setGatherInterval(gatherInterval);
                setSubmitInterval(submitInterval*60);
            }
        }catch (Exception e){
//            e.printStackTrace();
        }
        */
    }

    /**
     * Either the slot is full or the report interval have reached
     */
    public void tryReportData() {
        try {
            if (_samples.size() == 0) {
                LOG.info("No data to report. Skip this reporting cycle");
            } else {
                LOG.debug(String.format("Try reporting %d GPS samples", _samples.size()));

                JSONObject data = _composePayload();

                new ReportDataTask().execute(data);

                // clean this
                _samples.clear();
            }
        } catch (Exception e) {
            LOG.error("Cannot report data - " + e.getMessage(), e);
        }
    }

    class ReportDataTask extends AsyncTask<JSONObject, Void, Void> {

        private Exception exception;

        protected Void doInBackground(JSONObject... samples) {
            try {
                // LOG.debug("Try reporting back " + samples.length + " samples to server ...");
                for (JSONObject data : samples) {
                    _reportGpsData(data);
                }
            } catch (Exception e) {
                LOG.error("Last report data failed: " + e.getMessage());

                this.exception = e;
            }

            return null;
        }
    }

    private void cancelAlarm() {
        if (alarmIntent != null) {
            AlarmManager am = (AlarmManager) _logginService.getSystemService(Context.ALARM_SERVICE);
            PendingIntent sender = PendingIntent.getBroadcast(_logginService, 0, alarmIntent, PendingIntent.FLAG_UPDATE_CURRENT);
            am.cancel(sender);
        }
    }
}

