package com.mendhak.gpslogger.senders.osm;

import com.mendhak.gpslogger.BuildConfig;
import com.mendhak.gpslogger.common.PreferenceHelper;
import com.mendhak.gpslogger.common.Strings;
import com.mendhak.gpslogger.common.events.UploadEvents;
import com.mendhak.gpslogger.common.slf4j.Logs;
import com.path.android.jobqueue.Job;
import com.path.android.jobqueue.Params;
import de.greenrobot.event.EventBus;
import oauth.signpost.OAuthConsumer;
import okhttp3.*;

import org.slf4j.Logger;
import se.akerfeldt.okhttp.signpost.OkHttpOAuthConsumer;
import se.akerfeldt.okhttp.signpost.OkHttpOAuthProvider;
import se.akerfeldt.okhttp.signpost.SigningInterceptor;

import java.io.File;
import java.io.IOException;

public class OSMJob extends Job {


    private static final Logger LOG = Logs.of(OSMJob.class);
    //OAuthConsumer consumer;
    String gpsTraceUrl;
    File chosenFile;
    String description;
    String tags;
    String visibility;

    protected OSMJob(OAuthConsumer consumer, String gpsTraceUrl, File chosenFile, String description, String tags, String visibility) {
        super(new Params(1).requireNetwork().persist().addTags(getJobTag(chosenFile)));

//        this.consumer = consumer;
        this.gpsTraceUrl = gpsTraceUrl;
        this.chosenFile = chosenFile;
        this.description = description;
        this.tags = tags;
        this.visibility = visibility;
    }

    @Override
    public void onAdded() {

        LOG.debug("OSM Job added");
    }

    @Override
    public void onRun() throws Throwable {


        OkHttpOAuthConsumer consumer = new OkHttpOAuthConsumer(BuildConfig.OSM_CONSUMER_KEY, BuildConfig.OSM_CONSUMER_SECRET);
        consumer.setTokenWithSecret(PreferenceHelper.getInstance().getOSMAccessToken(), PreferenceHelper.getInstance().getOSMAccessTokenSecret());

        OkHttpClient client = new OkHttpClient.Builder().addInterceptor(new SigningInterceptor(consumer)).build();

        RequestBody requestBody = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("file", chosenFile.getName(), RequestBody.create(MediaType.parse("application/xml+gpx"), chosenFile))
                .addFormDataPart("description", Strings.isNullOrEmpty(description) ? "GPSLogger for Android" : description)
                .addFormDataPart("tags", tags)
                .addFormDataPart("visibility",visibility)
                .build();

//        consumer.sign(requestBody);


        Request request = new Request.Builder()
                .url(gpsTraceUrl)
                .post(requestBody)
                .build();


        Response response = client.newCall(request).execute();
        ResponseBody body = response.body();

        if(response.isSuccessful()){
            String message = body.string();
            LOG.debug("OSM Response body: " + message);
            EventBus.getDefault().post(new UploadEvents.OpenStreetMap().succeeded());
        }
        else {
            body.close();
            EventBus.getDefault().post(new UploadEvents.OpenStreetMap().failed());
        }
    }

    @Override
    protected void onCancel() {
        LOG.debug("OSM Job cancelled ");
    }

    @Override
    protected boolean shouldReRunOnThrowable(Throwable throwable) {
        LOG.error("Could not send to OpenStreetMap", throwable);
        EventBus.getDefault().post(new UploadEvents.OpenStreetMap().failed("Could not send to OpenStreetMap", throwable));
        return false;
    }

    public static String getJobTag(File gpxFile) {
        return "OSM" + gpxFile.getName();

    }
}
