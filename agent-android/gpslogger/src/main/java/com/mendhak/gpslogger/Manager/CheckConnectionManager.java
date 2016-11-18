package com.mendhak.gpslogger.Manager;

import android.os.AsyncTask;
import android.text.TextUtils;
import android.util.Log;
import com.mendhak.gpslogger.common.PreferenceHelper;
import com.mendhak.gpslogger.common.events.CommandEvents;
import com.mendhak.gpslogger.common.events.ProfileEvents;
import com.mendhak.gpslogger.common.slf4j.Logs;
import com.mendhak.gpslogger.model.Config;
import com.mendhak.gpslogger.model.ConnectionInfo;
import com.mendhak.gpslogger.utils.GsonUtil;
import de.greenrobot.event.EventBus;
import okhttp3.*;
import org.slf4j.Logger;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

/**
 * Created by steven.li on 8/29/16.
 */
public class CheckConnectionManager {
    private static final String KEY_CONNECTION_CONFIG = "key_connection_config";
    public static final CheckConnectionManager stance = new CheckConnectionManager();
    private static final Logger LOG = Logs.of(CheckConnectionManager.class);

    private OkHttpClient httpclient;
    private Config mConfig;
    private PreferenceHelper mPreferenceHelper;
    private boolean hasInit = false;

    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

    private CheckConnectionManager() {
    }

    public void init() {
        if (!hasInit) {
            hasInit = true;
            mPreferenceHelper = PreferenceHelper.getInstance();

            OkHttpClient.Builder builder = new OkHttpClient.Builder();
            builder.connectTimeout(30, TimeUnit.SECONDS);
            builder.readTimeout(30, TimeUnit.SECONDS);
            builder.writeTimeout(30, TimeUnit.SECONDS);
            this.httpclient = builder.build();

            String configInfo = mPreferenceHelper.getString(KEY_CONNECTION_CONFIG);
            if (TextUtils.isEmpty(configInfo)) {
                mConfig = null;
            } else {
                mConfig = GsonUtil.fromJson(configInfo, Config.class);
            }
        }
    }

    public void checkConnetion(final Config config) {
        mConfig = config;
        final Config.Gate gate = mConfig.gate;
        final Config.App app = mConfig.app;

        AsyncTask asyncTask = new AsyncTask() {
            @Override
            protected Object doInBackground(Object[] params) {
                String path;
                if (config.ssl) {
                    path = String.format("https://%s/rest/connect/%s", config.host + ":" + config.port, app.key);
                } else {
                    path = String.format("http://%s/rest/connect/%s", config.host + ":" + config.port, app.key);
                }

                ConnectionInfo info = new ConnectionInfo();
                info.code = mConfig.code;

                RequestBody body = RequestBody.create(JSON, GsonUtil.toJson(info));
                Request post = new Request.Builder().url(path).post(body).build();

                Response response = null;
                try {
                    response = httpclient.newCall(post).execute();
                    String retString = response.body().string();
                    if (200 != response.code()) {
                        LOG.warn("Reporting get HTTP code - " + response.code() + " and payload:\n" + retString);
                    } else {
                        LOG.debug("Reporting get HTTP code - " + response.code() + " and payload:\n" + retString);
                        saveConfig();
                        return "Ok";
                    }
                } catch (IOException e) {
                    Log.e("CheckConnectionManager", e.getMessage(), e);
                }
                return null;
            }

            @Override
            protected void onPostExecute(Object o) {
                if (o != null) {
                    EventBus.getDefault().post(new ProfileEvents.UpdatePeriodicProfile());
                    EventBus.getDefault().post(new CommandEvents.RequestStartStop(true));
                } else {
                    super.onPostExecute(o);
                }
            }
        };

        asyncTask.execute();
    }

    private void saveConfig() {
        Config.Gate gate = mConfig.gate;
        Config.App app = mConfig.app;
        mPreferenceHelper.setMobileTrackingAppKey(app.key);
        mPreferenceHelper.setMobileTrackingUseSSL(gate.ssl);
        mPreferenceHelper.setMobileTrackingEndpoint(gate.host + ":" + gate.port);
        mPreferenceHelper.setMobileTrackingReportInterval(app.interval);

        mPreferenceHelper.putString(KEY_CONNECTION_CONFIG, GsonUtil.toJson(mConfig));
    }

    public boolean hasConfig() {
        return mConfig != null;
    }
}
