package com.mendhak.gpslogger.loggers.customurl;

import android.location.Location;
import android.util.Base64;
import com.mendhak.gpslogger.common.SerializableLocation;
import com.mendhak.gpslogger.common.Strings;
import com.mendhak.gpslogger.common.events.UploadEvents;
import com.mendhak.gpslogger.common.slf4j.Logs;
import com.path.android.jobqueue.Job;
import com.path.android.jobqueue.Params;
import de.greenrobot.event.EventBus;
import org.slf4j.Logger;

import javax.net.ssl.HttpsURLConnection;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.Date;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CustomUrlJob extends Job {

    private static final Logger LOG = Logs.of(CustomUrlJob.class);
    private SerializableLocation loc;
    private String annotation;
    private String logUrl;
    private float batteryLevel;
    private String androidId;

    public CustomUrlJob(String customLoggingUrl, Location loc, String annotation, float batteryLevel, String androidId) {
        super(new Params(1).requireNetwork().persist());
        this.loc = new SerializableLocation(loc);
        this.annotation = annotation;
        this.logUrl = customLoggingUrl;
        this.batteryLevel = batteryLevel;
        this.androidId = androidId;
    }

    @Override
    public void onAdded() {
    }

    @Override
    public void onRun() throws Throwable {
        HttpURLConnection conn;

        String basicUsername="", basicPassword="";
        Pattern r = Pattern.compile("(\\w+):(\\w+)@.+"); //Looking for http://username:password@example.com/....
        Matcher m =  r.matcher(logUrl);
        while(m.find()){
            basicUsername = m.group(1);
            basicPassword = m.group(2);
            logUrl = logUrl.replace(basicUsername + ":" + basicPassword+"@","");
        }

        //String logUrl = "http://192.168.1.65:8000/test?lat=%LAT&lon=%LON&sat=%SAT&desc=%DESC&alt=%ALT&acc=%ACC&dir=%DIR&prov=%PROV
        // &spd=%SPD&time=%TIME&battery=%BATT&androidId=%AID&serial=%SER";

        logUrl = logUrl.replaceAll("(?i)%lat", String.valueOf(loc.getLatitude()));
        logUrl = logUrl.replaceAll("(?i)%lon", String.valueOf(loc.getLongitude()));
        logUrl = logUrl.replaceAll("(?i)%sat", String.valueOf(loc.getSatelliteCount()));
        logUrl = logUrl.replaceAll("(?i)%desc", String.valueOf(URLEncoder.encode(Strings.htmlDecode(annotation), "UTF-8")));
        logUrl = logUrl.replaceAll("(?i)%alt", String.valueOf(loc.getAltitude()));
        logUrl = logUrl.replaceAll("(?i)%acc", String.valueOf(loc.getAccuracy()));
        logUrl = logUrl.replaceAll("(?i)%dir", String.valueOf(loc.getBearing()));
        logUrl = logUrl.replaceAll("(?i)%prov", String.valueOf(loc.getProvider()));
        logUrl = logUrl.replaceAll("(?i)%spd", String.valueOf(loc.getSpeed()));
        logUrl = logUrl.replaceAll("(?i)%time", String.valueOf(Strings.getIsoDateTime(new Date(loc.getTime()))));
        logUrl = logUrl.replaceAll("(?i)%batt", String.valueOf(batteryLevel));
        logUrl = logUrl.replaceAll("(?i)%aid", String.valueOf(androidId));
        logUrl = logUrl.replaceAll("(?i)%ser", String.valueOf(Strings.getBuildSerial()));

        LOG.debug("Sending to URL: " + logUrl);
        URL url = new URL(logUrl);

        if(url.getProtocol().equalsIgnoreCase("https")){
            HttpsURLConnection.setDefaultSSLSocketFactory(CustomUrlTrustEverything.getSSLContextSocketFactory());
            conn = (HttpsURLConnection)url.openConnection();
            ((HttpsURLConnection)conn).setHostnameVerifier(new CustomUrlTrustEverything.VerifyEverythingHostnameVerifier());
        } else {
            conn = (HttpURLConnection) url.openConnection();
        }

        conn.setRequestMethod("GET");

        if(!Strings.isNullOrEmpty(basicPassword) && !Strings.isNullOrEmpty(basicUsername) ){
            String basicAuth = "Basic " + new String(Base64.encode((basicUsername + ":" + basicPassword).getBytes(), Base64.DEFAULT));
            conn.setRequestProperty("Authorization", basicAuth);
        }


        if(conn.getResponseCode() != 200){
            LOG.error("Status code: " + String.valueOf(conn.getResponseCode()));
        } else {
            LOG.debug("Status code: " + String.valueOf(conn.getResponseCode()));
        }

        EventBus.getDefault().post(new UploadEvents.CustomUrl().succeeded());
    }

    @Override
    protected void onCancel() {

    }

    @Override
    protected boolean shouldReRunOnThrowable(Throwable throwable) {
        EventBus.getDefault().post(new UploadEvents.CustomUrl().failed("Could not send to custom URL", throwable));
        LOG.error("Could not send to custom URL", throwable);
        return true;
    }

    @Override
    protected int getRetryLimit() {
        return 2;
    }
}
