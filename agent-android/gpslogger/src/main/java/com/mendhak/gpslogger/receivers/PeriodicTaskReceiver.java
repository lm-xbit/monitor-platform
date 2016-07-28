package com.mendhak.gpslogger.receivers;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.os.AsyncTask;
import android.os.SystemClock;
import com.mendhak.gpslogger.GpsLoggingService;
import com.mendhak.gpslogger.common.IntentConstants;
import com.mendhak.gpslogger.common.PreferenceHelper;
import com.mendhak.gpslogger.common.Session;
import com.mendhak.gpslogger.common.Strings;
import com.mendhak.gpslogger.common.slf4j.Logs;
import com.mendhak.gpslogger.model.Sample;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.List;

/**
 * Created with IntelliJ IDEA.
 * User: ning.chen
 * Date: 3/22/16
 * To change this template use File | Settings | File Templates.
 */
public class PeriodicTaskReceiver extends BroadcastReceiver {
    private static final String INTENT_ACTION_COLLECT = "collect_gps_location_samples";
    private static final Logger LOG = Logs.of(PeriodicTaskReceiver.class);

    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");
    private final OkHttpClient httpclient = new OkHttpClient();

    /**
     * We can gather sample at 5 seconds minimum, we try to cache at most 1 minutes data (so it is 12 slots)
     * We report either the cache is full or we have reached the report interval
     */
    private final static int _SLOT_NUM = 12;
    private final List<Sample> _samples = new ArrayList<Sample>(_SLOT_NUM);
    long _lastReportEpcoh = 0;

    private boolean _ssl = false;
    private String _endpoint;
    private String _type;
    private Integer _user;
    private Integer _app;
    private String _key;
    private int _reportInterval;

    @Override
    public void onReceive(Context context, Intent intent) {
        if (!Strings.isNullOrEmpty(intent.getAction())) {
            if (intent.getAction().equals("android.intent.action.BATTERY_LOW")) {
                // TODO ...
            }
            else if (intent.getAction().equals("android.intent.action.BATTERY_OKAY")) {
                // TODO ...
            }
            else if (intent.getAction().equals(INTENT_ACTION_COLLECT)) {
                Context appContext = context.getApplicationContext();
                Intent startServiceIntent = new Intent(appContext, GpsLoggingService.class);
                startServiceIntent.putExtra(IntentConstants.SAMPLE_LOCATION, true);
                appContext.startService(startServiceIntent);
            }
        }
    }

    public void collectLocationSample(Context context) {
        Sample sample = _gatherSample(System.currentTimeMillis());
        _samples.add(sample);

        _tryReportData();
    }

    public void initialize() {
        PreferenceHelper preferenceHelper = PreferenceHelper.getInstance();
        /**
         * Todo: configurable
         */
        this._reportInterval = preferenceHelper.getMobileTrackingReportInterval() * 1000;
        this._ssl = preferenceHelper.getMobileTrackingUseSSL();
        this._endpoint = preferenceHelper.getMobileTrackingEndpoint();

        this._type = "mobile-tracking";
    	this._user = 2;  // user ning
    	this._app = 2;   // app for ning's android
        this._key = "android"; // key for ning's android app

        LOG.info("Initializing periodic task for reporting GPS data with end point - " + this._endpoint);
    }

    /**
     * Start the periodic alarm if not already been started up yet
     *
     * @param context
     */
    public void startPeriodicTaskHeartBeat(Context context) {
        Intent alarmIntent = new Intent(context, PeriodicTaskReceiver.class);
        boolean isAlarmUp = PendingIntent.getBroadcast(context, 0, alarmIntent, PendingIntent.FLAG_NO_CREATE) != null;

        if (!isAlarmUp) {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            alarmIntent.setAction(INTENT_ACTION_COLLECT);
            PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 0, alarmIntent, 0);
            alarmManager.setInexactRepeating(AlarmManager.ELAPSED_REALTIME_WAKEUP, SystemClock.elapsedRealtime(), 15 * 100, pendingIntent);

            // reset ..
            _samples.clear();
            _lastReportEpcoh = 0;

            LOG.info("GPS logging is started. Start reporting task ...");
        }
    }

    /**
     * Stop the periodic alarm
     *
     * @param context
     */
    public void stopPeriodicTaskHeartBeat(Context context) {
        LOG.info("GPS logging is disabled. Stop reporting task ...");

        _tryReportData();

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent alarmIntent = new Intent(context, PeriodicTaskReceiver.class);
        alarmIntent.setAction(INTENT_ACTION_COLLECT);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 0, alarmIntent, 0);
        alarmManager.cancel(pendingIntent);
    }


    /**
     * Gather one sample
     */
    private Sample _gatherSample(long curTime) {
        Location location = Session.getCurrentLocationInfo();

        if(location == null) {
            LOG.warn("Found invalid current location for sample - " + curTime);
            return new Sample(curTime);
        }
        else {
            LOG.info(String.format(
                    "Has valid current location for sample - %d: (lat=%.2f, lng=%.2f, alt=%.2f, acc=%.2f)",
                    curTime, location.getLatitude(), location.getLongitude(), location.getAccuracy(), location.getAccuracy()
            ));

            return new Sample(curTime, location.getLatitude(), location.getLongitude(), location.getAltitude(),
            		location.getSpeed(), location.getBearing(), location.getAccuracy());
        }
    }

    /**
     * Report GPS Data
     * We report data to make sure samples in sets of 4
     * (as each minute contains 4 samples)
     *
     * If there are more data than required, we would just
     * keep them in cache to wait next time for the reporting
     */
    private void _reportGpsData(JSONObject data) throws Exception {
    	String retString;

    	String path;

        if(_ssl) {
            path = String.format("https://%s/api/data", _endpoint);
        }
        else {
            path = String.format("http://%s/api/data", _endpoint);
        }

        // LOG.info("Try reporting with path - " + path);

        RequestBody body = RequestBody.create(JSON, data.toString());
        Request httpost = new Request.Builder().url(path).post(body).build();

        Response res = httpclient.newCall(httpost).execute();

        LOG.info("Reporting get HTTP code - " + res.code());

        if (200 != res.code()) {
            throw new Exception(String.format(
                    "Server returns %d: %s", res.code(), res.message()
            ));
        }

        retString = res.body().string();
        // LOG.info("Receive response - " + retString);
        try{
	        if ( new JSONObject(retString).getBoolean("u")){
	            loadConf();
	        }
        }catch (Exception e){
        	//Do nothing!
        }
    }

    /**
     * init submitting data by creating the JSON object to be reported
     *
     * {
     *    type: <app type, ES index, lowercase string>
     *    user: <uid, long>
     *    app: <appid, long>
     *    key: <appKey, string>
     *    data: [{
     *        timestamp: xxxx,
     *        metrics: [{
     *            name: metric1,
     *            value: 123
     *        }, {
     *            name: metric2,
     *            value: 456
     *        }]
     *    }, {
     *        timestamp: xxxx,
     *        metrics: [{
     *            name: metric1,
     *            value: 123
     *        }, {
     *            name: metric2,
     *            value: 456
     *        }]
     *    }]
     * }
     */
    private JSONObject _composePayload(){
        JSONObject submitData = new JSONObject();
        JSONArray samples = new JSONArray();
        try {
            submitData.put("type", _type);
            submitData.put("user", _user);
            submitData.put("app", _app);
            submitData.put("key", _key);
            submitData.put("data", samples);

            for(Sample sample : _samples) {
                JSONObject tmp = new JSONObject();
                samples.put(tmp);

                tmp.put("timestamp", sample.epoch);
                tmp.put("metrics", _toMetrics(sample));
            }
        }catch(Exception e){
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
        if(!Double.isNaN(sample.lat)) {
            lat.put("value", sample.lat);
        }
        metrics.put(lat);

        JSONObject lng = new JSONObject();
        lng.put("name", "longitude");
        if(!Double.isNaN(sample.lng)) {
            lng.put("value", sample.lng);
        }
        metrics.put(lng);

        JSONObject alt = new JSONObject();
        alt.put("name", "altitude");
        if(!Double.isNaN(sample.alt)) {
            alt.put("value", sample.alt);
        }
        metrics.put(alt);

        JSONObject acc = new JSONObject();
        acc.put("name", "accuracy");
        if(!Double.isNaN(sample.accuracy)) {
            acc.put("value", sample.accuracy);
        }
        metrics.put(acc);

        return metrics;
    }

    /**
     * TODO
     */
    private void loadConf(){
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

    private void _tryReportData() {
        long now = System.currentTimeMillis();
        if((_samples.size() >= _SLOT_NUM) || (now - _lastReportEpcoh) > _reportInterval) {
            try {
                if (_samples.size() == 0) {
                    LOG.info("No data to report. Skip this reporting cycle");
                }
                else {
                    JSONObject data = _composePayload();

                    new ReportDataTask().execute(data);

                    LOG.info("GPS sample reported. Count - " + _samples.size());
                }

            }
            catch(Exception e) {
                LOG.error("Cannot report data - " + e.getMessage(), e);
            }
            finally {
                // clean this
                _samples.clear();
                _lastReportEpcoh = now;
            }
        }
    }

    class ReportDataTask extends AsyncTask<JSONObject, Void, Void> {

        private Exception exception;

        protected Void doInBackground(JSONObject... samples) {
            try {
                for(JSONObject data : samples) {
                    _reportGpsData(data);
                }
            }
            catch (Exception e) {
                this.exception = e;
            }

            return null;
        }
    }
}
