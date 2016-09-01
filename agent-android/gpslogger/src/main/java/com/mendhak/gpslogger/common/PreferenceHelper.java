package com.mendhak.gpslogger.common;


import android.content.SharedPreferences;
import android.location.LocationManager;
import android.preference.PreferenceManager;
import com.mendhak.gpslogger.R;
import com.mendhak.gpslogger.common.slf4j.Logs;
import org.slf4j.Logger;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Properties;
import java.util.Set;

public class PreferenceHelper {

    private static PreferenceHelper instance = null;
    private SharedPreferences prefs;
    private static final Logger LOG = Logs.of(PreferenceHelper.class);

    /**
     * Use PreferenceHelper.getInstance()
     */
    private PreferenceHelper() {

    }

    public static PreferenceHelper getInstance() {
        if (instance == null) {
            instance = new PreferenceHelper();
            instance.prefs = PreferenceManager.getDefaultSharedPreferences(AppSettings.getInstance().getApplicationContext());
        }

        return instance;
    }

    @ProfilePreference(name = PreferenceNames.MTRACKING_USE_SSL)
    public boolean getMobileTrackingUseSSL() {
        return prefs.getBoolean(PreferenceNames.MTRACKING_USE_SSL, false);
    }

    public void setMobileTrackingUseSSL(boolean ssl) {
        prefs.edit().putBoolean(PreferenceNames.MTRACKING_USE_SSL, ssl).apply();
    }

    @ProfilePreference(name = PreferenceNames.MTRACKING_ENDPOINT)
    public String getMobileTrackingEndpoint() {
        return prefs.getString(PreferenceNames.MTRACKING_ENDPOINT, "54.222.244.228:8080");
    }

    public void setMobileTrackingEndpoint(String endpoint) {
        prefs.edit().putString(PreferenceNames.MTRACKING_ENDPOINT, endpoint).apply();
    }

    @ProfilePreference(name = PreferenceNames.MTRACKING_REPORT_INTERVAL)
    public Long getMobileTrackingReportInterval() {
        return prefs.getLong(PreferenceNames.MTRACKING_REPORT_INTERVAL, 60);
    }

    public void setMobileTrackingReportInterval(long value) {
        prefs.edit().putLong(PreferenceNames.MTRACKING_REPORT_INTERVAL, value).apply();
    }

    @ProfilePreference(name = PreferenceNames.MTRACKING_APP_KEY)
    public String getMobileTrackingAppKey() {
        return prefs.getString(PreferenceNames.MTRACKING_APP_KEY, "mobile-tracking");
    }

    public void setMobileTrackingAppKey(String appKey) {
        prefs.edit().putString(PreferenceNames.MTRACKING_APP_KEY, appKey).apply();
    }

    /**
     * Whether to auto send to Dropbox
     */
    @ProfilePreference(name = PreferenceNames.AUTOSEND_DROPBOX_ENABLED)
    public boolean isDropboxAutoSendEnabled() {
        return prefs.getBoolean(PreferenceNames.AUTOSEND_DROPBOX_ENABLED, false);
    }

    public String getDropBoxAccessKeyName() {
        return prefs.getString(PreferenceNames.DROPBOX_ACCESS_KEY, null);
    }

    public void setDropBoxAccessKeyName(String key) {
        prefs.edit().putString(PreferenceNames.DROPBOX_ACCESS_KEY, key).apply();
    }


    /**
     * Legacy - only used to check if user is still on Oauth1 and to upgrade them.
     *
     * @return
     */
    public String getDropBoxOauth1Secret() {
        return prefs.getString(PreferenceNames.DROPBOX_ACCESS_SECRET, null);
    }

    public void setDropBoxOauth1Secret(String secret) {
        prefs.edit().putString(PreferenceNames.DROPBOX_ACCESS_SECRET, secret).apply();
    }


    /**
     * Whether automatic sending to email is enabled
     */
    @ProfilePreference(name = PreferenceNames.AUTOSEND_EMAIL_ENABLED)
    public boolean isEmailAutoSendEnabled() {
        return prefs.getBoolean(PreferenceNames.AUTOSEND_EMAIL_ENABLED, false);
    }


    /**
     * SMTP Server to use when sending emails
     */
    @ProfilePreference(name = PreferenceNames.EMAIL_SMTP_SERVER)
    public String getSmtpServer() {
        return prefs.getString(PreferenceNames.EMAIL_SMTP_SERVER, "");
    }

    /**
     * Sets SMTP Server to use when sending emails
     */
    public void setSmtpServer(String smtpServer) {
        prefs.edit().putString(PreferenceNames.EMAIL_SMTP_SERVER, smtpServer).apply();
    }

    /**
     * SMTP Port to use when sending emails
     */
    @ProfilePreference(name = PreferenceNames.EMAIL_SMTP_PORT)
    public String getSmtpPort() {
        return prefs.getString(PreferenceNames.EMAIL_SMTP_PORT, "25");
    }

    public void setSmtpPort(String port) {
        prefs.edit().putString(PreferenceNames.EMAIL_SMTP_PORT, port).apply();
    }

    /**
     * SMTP Username to use when sending emails
     */
    @ProfilePreference(name = PreferenceNames.EMAIL_SMTP_USERNAME)
    public String getSmtpUsername() {
        return prefs.getString(PreferenceNames.EMAIL_SMTP_USERNAME, "");
    }


    /**
     * SMTP Password to use when sending emails
     */
    @ProfilePreference(name = PreferenceNames.EMAIL_SMTP_PASSWORD)
    public String getSmtpPassword() {
        return prefs.getString(PreferenceNames.EMAIL_SMTP_PASSWORD, "");
    }

    /**
     * Whether SSL is enabled when sending emails
     */
    @ProfilePreference(name = PreferenceNames.EMAIL_SMTP_SSL)
    public boolean isSmtpSsl() {
        return prefs.getBoolean(PreferenceNames.EMAIL_SMTP_SSL, true);
    }

    /**
     * Sets whether SSL is enabled when sending emails
     */
    public void setSmtpSsl(boolean smtpSsl) {
        prefs.edit().putBoolean(PreferenceNames.EMAIL_SMTP_SSL, smtpSsl).apply();
    }


    /**
     * Email addresses to send to
     */
    @ProfilePreference(name = PreferenceNames.EMAIL_TARGET)
    public String getAutoEmailTargets() {
        return prefs.getString(PreferenceNames.EMAIL_TARGET, "");
    }


    /**
     * SMTP from address to use
     */
    @ProfilePreference(name = PreferenceNames.EMAIL_FROM)
    private String getSmtpFrom() {
        return prefs.getString(PreferenceNames.EMAIL_FROM, "");
    }

    /**
     * The from address to use when sending an email, uses {@link #getSmtpUsername()} if {@link #getSmtpFrom()} is not specified
     */
    public String getSmtpSenderAddress() {
        if (getSmtpFrom() != null && getSmtpFrom().length() > 0) {
            return getSmtpFrom();
        }

        return getSmtpUsername();
    }


    /**
     * FTP Server name for auto send
     */
    @ProfilePreference(name = PreferenceNames.FTP_SERVER)
    public String getFtpServerName() {
        return prefs.getString(PreferenceNames.FTP_SERVER, "");
    }


    /**
     * FTP Port for auto send
     */
    @ProfilePreference(name = PreferenceNames.FTP_PORT)
    public int getFtpPort() {
        return Strings.toInt(prefs.getString(PreferenceNames.FTP_PORT, "21"), 21);
    }


    /**
     * FTP Username for auto send
     */
    @ProfilePreference(name = PreferenceNames.FTP_USERNAME)
    public String getFtpUsername() {
        return prefs.getString(PreferenceNames.FTP_USERNAME, "");
    }


    /**
     * FTP Password for auto send
     */
    @ProfilePreference(name = PreferenceNames.FTP_PASSWORD)
    public String getFtpPassword() {
        return prefs.getString(PreferenceNames.FTP_PASSWORD, "");
    }

    /**
     * Whether to use FTPS
     */
    @ProfilePreference(name = PreferenceNames.FTP_USE_FTPS)
    public boolean shouldFtpUseFtps() {
        return prefs.getBoolean(PreferenceNames.FTP_USE_FTPS, false);
    }


    /**
     * FTP protocol to use (SSL or TLS)
     */
    @ProfilePreference(name = PreferenceNames.FTP_SSLORTLS)
    public String getFtpProtocol() {
        return prefs.getString(PreferenceNames.FTP_SSLORTLS, "");
    }


    /**
     * Whether to use FTP Implicit mode for auto send
     */
    @ProfilePreference(name = PreferenceNames.FTP_IMPLICIT)
    public boolean isFtpImplicit() {
        return prefs.getBoolean(PreferenceNames.FTP_IMPLICIT, false);
    }


    /**
     * Whether to auto send to FTP target
     */
    @ProfilePreference(name = PreferenceNames.AUTOSEND_FTP_ENABLED)
    public boolean isFtpAutoSendEnabled() {
        return prefs.getBoolean(PreferenceNames.AUTOSEND_FTP_ENABLED, false);
    }


    /**
     * FTP Directory on the server for auto send
     */
    @ProfilePreference(name = PreferenceNames.FTP_DIRECTORY)
    public String getFtpDirectory() {
        return prefs.getString(PreferenceNames.FTP_DIRECTORY, "GPSLogger");
    }

    /**
     * Sets GPS Logger folder path
     */
    public void setGpsLoggerFolder(String folderPath) {
        prefs.edit().putString(PreferenceNames.GPSLOGGER_FOLDER, folderPath).apply();
    }


    /**
     * Whether to auto send to Google Drive
     */
    @ProfilePreference(name = PreferenceNames.AUTOSEND_GOOGLEDRIVE_ENABLED)
    public boolean isGDocsAutoSendEnabled() {
        return prefs.getBoolean(PreferenceNames.AUTOSEND_GOOGLEDRIVE_ENABLED, false);
    }

    /**
     * Target directory for Google Drive auto send
     */
    @ProfilePreference(name = PreferenceNames.GOOGLEDRIVE_FOLDERNAME)
    public String getGoogleDriveFolderName() {
        return prefs.getString(PreferenceNames.GOOGLEDRIVE_FOLDERNAME, "GPSLogger for Android");
    }

    /**
     * Google Drive OAuth token
     */
    public String getGoogleDriveAuthToken() {
        return prefs.getString(PreferenceNames.GOOGLEDRIVE_AUTHTOKEN, "");
    }

    /**
     * Sets OAuth token for Google Drive auto send
     */
    public void setGoogleDriveAuthToken(String authToken) {
        prefs.edit().putString(PreferenceNames.GOOGLEDRIVE_AUTHTOKEN, authToken).apply();
    }

    /**
     * Gets Google account used for Google Drive auto send
     */
    @ProfilePreference(name = PreferenceNames.GOOGLEDRIVE_ACCOUNTNAME)
    public String getGoogleDriveAccountName() {
        return prefs.getString(PreferenceNames.GOOGLEDRIVE_ACCOUNTNAME, "");
    }

    /**
     * Sets account name to use for Google Drive auto send
     */
    public void setGoogleDriveAccountName(String accountName) {
        prefs.edit().putString(PreferenceNames.GOOGLEDRIVE_ACCOUNTNAME, accountName).apply();
    }


    /**
     * The minimum seconds interval between logging points
     */
    @ProfilePreference(name = PreferenceNames.MINIMUM_INTERVAL)
    public int getMinimumLoggingInterval() {
        return Strings.toInt(prefs.getString(PreferenceNames.MINIMUM_INTERVAL, "5"), 5);
    }

    /**
     * Sets the minimum time interval between logging points
     *
     * @param minimumSeconds
     *         - in seconds
     */
    public void setMinimumLoggingInterval(int minimumSeconds) {
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString(PreferenceNames.MINIMUM_INTERVAL, String.valueOf(minimumSeconds));
        editor.apply();
    }


    /**
     * The minimum distance, in meters, to have traveled before a point is recorded
     */
    @ProfilePreference(name = PreferenceNames.MINIMUM_DISTANCE)
    public int getMinimumDistanceInterval() {
        return (Strings.toInt(prefs.getString(PreferenceNames.MINIMUM_DISTANCE, "0"), 0));
    }

    /**
     * Sets the minimum distance to have traveled before a point is recorded
     *
     * @param distanceBeforeLogging
     *         - in meters
     */
    public void setMinimumDistanceInMeters(int distanceBeforeLogging) {
        prefs.edit().putString(PreferenceNames.MINIMUM_DISTANCE, String.valueOf(distanceBeforeLogging)).apply();
    }


    /**
     * The minimum accuracy of a point before the point is recorded, in meters
     */
    @ProfilePreference(name = PreferenceNames.MINIMUM_ACCURACY)
    public int getMinimumAccuracy() {
        return (Strings.toInt(prefs.getString(PreferenceNames.MINIMUM_ACCURACY, "0"), 0));
    }


    /**
     * Whether to keep GPS on between fixes
     */
    @ProfilePreference(name = PreferenceNames.KEEP_GPS_ON_BETWEEN_FIXES)
    public boolean shouldKeepGPSOnBetweenFixes() {
        return prefs.getBoolean(PreferenceNames.KEEP_GPS_ON_BETWEEN_FIXES, false);
    }

    /**
     * Set whether to keep GPS on between fixes
     */
    public void setShouldKeepGPSOnBetweenFixes(boolean keepFix) {
        prefs.edit().putBoolean(PreferenceNames.KEEP_GPS_ON_BETWEEN_FIXES, keepFix).apply();
    }


    /**
     * How long to keep retrying for a fix if one with the user-specified accuracy hasn't been found
     */
    @ProfilePreference(name = PreferenceNames.LOGGING_RETRY_TIME)
    public int getLoggingRetryPeriod() {
        return (Strings.toInt(prefs.getString(PreferenceNames.LOGGING_RETRY_TIME, "60"), 60));
    }


    /**
     * Sets how long to keep trying for an accurate fix
     *
     * @param retryInterval
     *         in seconds
     */
    public void setLoggingRetryPeriod(int retryInterval) {
        prefs.edit().putString(PreferenceNames.LOGGING_RETRY_TIME, String.valueOf(retryInterval)).apply();
    }

    /**
     * How long to keep retrying for an accurate point before giving up
     */
    @ProfilePreference(name = PreferenceNames.ABSOLUTE_TIMEOUT)
    public int getAbsoluteTimeoutForAcquiringPosition() {
        return (Strings.toInt(prefs.getString(PreferenceNames.ABSOLUTE_TIMEOUT, "120"), 120));
    }

    /**
     * Sets how long to keep retrying for an accurate point before giving up
     *
     * @param absoluteTimeout
     *         in seconds
     */
    public void setAbsoluteTimeoutForAcquiringPosition(int absoluteTimeout) {
        prefs.edit().putString(PreferenceNames.ABSOLUTE_TIMEOUT, String.valueOf(absoluteTimeout)).apply();
    }

    /**
     * Whether to start logging on application launch
     */
    @ProfilePreference(name = PreferenceNames.START_LOGGING_ON_APP_LAUNCH)
    public boolean shouldStartLoggingOnAppLaunch() {
        return prefs.getBoolean(PreferenceNames.START_LOGGING_ON_APP_LAUNCH, false);
    }

    /**
     * Whether to start logging when phone is booted up
     */
    @ProfilePreference(name = PreferenceNames.START_LOGGING_ON_BOOTUP)
    public boolean shouldStartLoggingOnBootup() {
        return prefs.getBoolean(PreferenceNames.START_LOGGING_ON_BOOTUP, false);
    }


    /**
     * Which navigation item the user selected
     */
    public int getUserSelectedNavigationItem() {
        return Strings.toInt(prefs.getString(PreferenceNames.SELECTED_NAVITEM, "0"), 0);
    }

    /**
     * Sets which navigation item the user selected
     */
    public void setUserSelectedNavigationItem(int position) {
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString(PreferenceNames.SELECTED_NAVITEM, String.valueOf(position));
        editor.apply();
    }

    /**
     * Whether to hide the buttons when displaying the app notification
     */
    @ProfilePreference(name = PreferenceNames.HIDE_NOTIFICATION_BUTTONS)
    public boolean shouldHideNotificationButtons() {
        return prefs.getBoolean(PreferenceNames.HIDE_NOTIFICATION_BUTTONS, false);
    }


    /**
     * Whether to display certain values using imperial units
     */
    @ProfilePreference(name = PreferenceNames.DISPLAY_IMPERIAL)
    public boolean shouldDisplayImperialUnits() {
        return prefs.getBoolean(PreferenceNames.DISPLAY_IMPERIAL, false);
    }


    /**
     * Whether to log to KML file
     */
    @ProfilePreference(name = PreferenceNames.LOG_TO_KML)
    public boolean shouldLogToKml() {
        return prefs.getBoolean(PreferenceNames.LOG_TO_KML, false);
    }


    /**
     * Whether to log to GPX file
     */
    @ProfilePreference(name = PreferenceNames.LOG_TO_GPX)
    public boolean shouldLogToGpx() {
        return prefs.getBoolean(PreferenceNames.LOG_TO_GPX, true);
    }


    /**
     * Whether to log to a plaintext CSV file
     */
    @ProfilePreference(name = PreferenceNames.LOG_TO_CSV)
    public boolean shouldLogToPlainText() {
        return prefs.getBoolean(PreferenceNames.LOG_TO_CSV, false);
    }


    /**
     * Whether to log to NMEA file
     */
    @ProfilePreference(name = PreferenceNames.LOG_TO_NMEA)
    public boolean shouldLogToNmea() {
        return prefs.getBoolean(PreferenceNames.LOG_TO_NMEA, false);
    }


    /**
     * Whether to log to a custom URL. The app will log to the URL returned by {@link #getCustomLoggingUrl()}
     */
    @ProfilePreference(name = PreferenceNames.LOG_TO_URL)
    public boolean shouldLogToCustomUrl() {
        return prefs.getBoolean(PreferenceNames.LOG_TO_URL, false);
    }

    /**
     * The custom URL to log to.  Relevant only if {@link #shouldLogToCustomUrl()} returns true.
     */
    @ProfilePreference(name = PreferenceNames.LOG_TO_URL_PATH)
    public String getCustomLoggingUrl() {
        return prefs.getString(PreferenceNames.LOG_TO_URL_PATH, "http://localhost/log?lat=%LAT&longitude=%LON&time=%TIME&s=%SPD");
    }

    /**
     * Sets custom URL to log to, if {@link #shouldLogToCustomUrl()} returns true.
     */
    public void setCustomLoggingUrl(String customLoggingUrl) {
        prefs.edit().putString(PreferenceNames.LOG_TO_URL_PATH, customLoggingUrl).apply();
    }

    /**
     * Whether to log to OpenGTS.  See their <a href="http://opengts.sourceforge.net/OpenGTS_Config.pdf">installation guide</a>
     */
    @ProfilePreference(name = PreferenceNames.LOG_TO_OPENGTS)
    public boolean shouldLogToOpenGTS() {
        return prefs.getBoolean(PreferenceNames.LOG_TO_OPENGTS, false);
    }


    /**
     * Gets a list of location providers that the app will listen to
     */
    @ProfilePreference(name = PreferenceNames.LOCATION_LISTENERS)
    public Set<String> getChosenListeners() {
        Set<String> defaultListeners = new HashSet<>(getDefaultListeners());
        return prefs.getStringSet(PreferenceNames.LOCATION_LISTENERS, defaultListeners);
    }

    /**
     * Sets the list of location providers that the app will listen to
     *
     * @param chosenListeners
     *         a Set of listener names
     */
    public void setChosenListeners(Set<String> chosenListeners) {
        SharedPreferences.Editor editor = prefs.edit();
        editor.putStringSet(PreferenceNames.LOCATION_LISTENERS, chosenListeners);
        editor.apply();
    }

    /**
     * Sets the list of location providers that the app will listen to given their array positions in {@link #getAvailableListeners()}.
     */
    public void setChosenListeners(Integer... listenerIndices) {
        List<Integer> selectedItems = Arrays.asList(listenerIndices);
        final Set<String> chosenListeners = new HashSet<>();

        for (Integer selectedItem : selectedItems) {
            chosenListeners.add(getAvailableListeners().get(selectedItem));
        }

        if (chosenListeners.size() > 0) {
            setChosenListeners(chosenListeners);

        }
    }


    /**
     * Default set of listeners
     */
    public List<String> getDefaultListeners() {
        List<String> listeners = new ArrayList<>();
        listeners.add(LocationManager.GPS_PROVIDER);
        listeners.add(LocationManager.NETWORK_PROVIDER);
        return listeners;
    }


    /**
     * All the possible listeners
     *
     * @return
     */
    public List<String> getAvailableListeners() {

        List<String> listeners = new ArrayList<>();
        listeners.add(LocationManager.GPS_PROVIDER);
        listeners.add(LocationManager.NETWORK_PROVIDER);
        listeners.add(LocationManager.PASSIVE_PROVIDER);
        return listeners;
    }


    /**
     * New file creation preference: onceaday - once a day, customfile - custom file (static), everystart - every time the service starts
     */
    @ProfilePreference(name = PreferenceNames.NEW_FILE_CREATION_MODE)
    public String getNewFileCreationMode() {
        return prefs.getString(PreferenceNames.NEW_FILE_CREATION_MODE, "onceaday");
    }


    /**
     * Whether a new file should be created daily
     */
    public boolean shouldCreateNewFileOnceADay() {
        return (getNewFileCreationMode().equals("onceaday"));
    }


    /**
     * Whether only a custom file should be created
     */
    public boolean shouldCreateCustomFile() {
        return getNewFileCreationMode().equals("custom") || getNewFileCreationMode().equals("static");
    }


    /**
     * The custom filename to use if {@link #shouldCreateCustomFile()} returns true
     */
    @ProfilePreference(name = PreferenceNames.CUSTOM_FILE_NAME)
    public String getCustomFileName() {
        return prefs.getString(PreferenceNames.CUSTOM_FILE_NAME, "gpslogger");
    }


    /**
     * Sets custom filename to use if {@link #shouldCreateCustomFile()} returns true
     */
    public void setCustomFileName(String customFileName) {
        prefs.edit().putString(PreferenceNames.CUSTOM_FILE_NAME, customFileName).apply();
    }

    /**
     * Whether to prompt for a custom file name each time logging starts, if {@link #shouldCreateCustomFile()} returns true
     */
    @ProfilePreference(name = PreferenceNames.ASK_CUSTOM_FILE_NAME)
    public boolean shouldAskCustomFileNameEachTime() {
        return prefs.getBoolean(PreferenceNames.ASK_CUSTOM_FILE_NAME, true);
    }

    /**
     * Whether automatic sending to various targets (email,ftp, dropbox, etc) is enabled
     */
    @ProfilePreference(name = PreferenceNames.AUTOSEND_ENABLED)
    public boolean isAutoSendEnabled() {
        return prefs.getBoolean(PreferenceNames.AUTOSEND_ENABLED, false);
    }


    /**
     * The time, in minutes, before files are sent to the auto-send targets
     */
    @ProfilePreference(name = PreferenceNames.AUTOSEND_FREQUENCY)
    public int getAutoSendInterval() {
        return Math.round(Float.valueOf(prefs.getString(PreferenceNames.AUTOSEND_FREQUENCY, "60")));
    }


    /**
     * Whether to auto send to targets when logging is stopped
     */
    @ProfilePreference(name = PreferenceNames.AUTOSEND_ON_STOP)
    public boolean shouldAutoSendOnStopLogging() {
        return prefs.getBoolean(PreferenceNames.AUTOSEND_ON_STOP, false);
    }

    public void setDebugToFile(boolean writeToFile) {
        prefs.edit().putBoolean(PreferenceNames.DEBUG_TO_FILE, writeToFile).apply();
    }

    /**
     * Whether to write log messages to a debuglog.txt file
     */
    public boolean shouldDebugToFile() {
        return prefs.getBoolean(PreferenceNames.DEBUG_TO_FILE, false);
    }


    /**
     * Whether to zip the files up before auto sending to targets
     */
    @ProfilePreference(name = PreferenceNames.AUTOSEND_ZIP)
    public boolean shouldSendZipFile() {
        return prefs.getBoolean(PreferenceNames.AUTOSEND_ZIP, true);
    }


    /**
     * Whether to auto send to OpenGTS Server
     */
    @ProfilePreference(name = PreferenceNames.AUTOSEND_OPENGTS_ENABLED)
    public boolean isOpenGtsAutoSendEnabled() {
        return prefs.getBoolean(PreferenceNames.AUTOSEND_OPENGTS_ENABLED, false);
    }


    /**
     * OpenGTS Server name
     */
    @ProfilePreference(name = PreferenceNames.OPENGTS_SERVER)
    public String getOpenGTSServer() {
        return prefs.getString(PreferenceNames.OPENGTS_SERVER, "");
    }


    /**
     * OpenGTS Server Port
     */
    @ProfilePreference(name = PreferenceNames.OPENGTS_PORT)
    public String getOpenGTSServerPort() {
        return prefs.getString(PreferenceNames.OPENGTS_PORT, "");
    }


    /**
     * Communication method when talking to OpenGTS (either UDP or HTTP)
     */
    @ProfilePreference(name = PreferenceNames.OPENGTS_PROTOCOL)
    public String getOpenGTSServerCommunicationMethod() {
        return prefs.getString(PreferenceNames.OPENGTS_PROTOCOL, "");
    }


    /**
     * OpenGTS Server Path
     */
    @ProfilePreference(name = PreferenceNames.OPENGTS_SERVER_PATH)
    public String getOpenGTSServerPath() {
        return prefs.getString(PreferenceNames.OPENGTS_SERVER_PATH, "");
    }


    /**
     * Device ID for OpenGTS communication
     */
    @ProfilePreference(name = PreferenceNames.OPENGTS_DEVICE_ID)
    public String getOpenGTSDeviceId() {
        return prefs.getString(PreferenceNames.OPENGTS_DEVICE_ID, "");
    }


    /**
     * Account name for OpenGTS communication
     */
    @ProfilePreference(name = PreferenceNames.OPENGTS_ACCOUNT_NAME)
    public String getOpenGTSAccountName() {
        return prefs.getString(PreferenceNames.OPENGTS_ACCOUNT_NAME, "");
    }


    /**
     * Sets OpenStreetMap OAuth Token for auto send
     */
    public void setOSMAccessToken(String token) {
        prefs.edit().putString(PreferenceNames.OPENSTREETMAP_ACCESS_TOKEN, token).apply();
    }


    /**
     * Gets access token for OpenStreetMap auto send
     */
    public String getOSMAccessToken() {
        return prefs.getString(PreferenceNames.OPENSTREETMAP_ACCESS_TOKEN, "");
    }


    /**
     * Sets OpenStreetMap OAuth secret for auto send
     */
    public void setOSMAccessTokenSecret(String secret) {
        prefs.edit().putString(PreferenceNames.OPENSTREETMAP_ACCESS_TOKEN_SECRET, secret).apply();
    }

    /**
     * Gets access token secret for OpenStreetMap auto send
     */
    public String getOSMAccessTokenSecret() {
        return prefs.getString(PreferenceNames.OPENSTREETMAP_ACCESS_TOKEN_SECRET, "");
    }

    /**
     * Sets request token for OpenStreetMap auto send
     */
    public void setOSMRequestToken(String token) {
        prefs.edit().putString(PreferenceNames.OPENSTREETMAP_REQUEST_TOKEN, token).apply();
    }

    /**
     * Sets request token secret for OpenStreetMap auto send
     */
    public void setOSMRequestTokenSecret(String secret) {
        prefs.edit().putString(PreferenceNames.OPENSTREETMAP_REQUEST_TOKEN_SECRET, secret).apply();
    }

    /**
     * Description of uploaded trace on OpenStreetMap
     */
    @ProfilePreference(name = PreferenceNames.OPENSTREETMAP_DESCRIPTION)
    public String getOSMDescription() {
        return prefs.getString(PreferenceNames.OPENSTREETMAP_DESCRIPTION, "");
    }

    /**
     * Tags associated with uploaded trace on OpenStreetMap
     */
    @ProfilePreference(name = PreferenceNames.OPENSTREETMAP_TAGS)
    public String getOSMTags() {
        return prefs.getString(PreferenceNames.OPENSTREETMAP_TAGS, "");
    }

    /**
     * Visibility of uploaded trace on OpenStreetMap
     */
    @ProfilePreference(name = PreferenceNames.OPENSTREETMAP_VISIBILITY)
    public String getOSMVisibility() {
        return prefs.getString(PreferenceNames.OPENSTREETMAP_VISIBILITY, "private");
    }


    /**
     * Whether to auto send to OpenStreetMap
     */
    @ProfilePreference(name = PreferenceNames.AUTOSEND_OSM_ENABLED)
    public boolean isOsmAutoSendEnabled() {
        return prefs.getBoolean(PreferenceNames.AUTOSEND_OSM_ENABLED, false);
    }


    /**
     * OwnCloud server for auto send
     */
    @ProfilePreference(name = PreferenceNames.OWNCLOUD_SERVER)
    public String getOwnCloudServerName() {
        return prefs.getString(PreferenceNames.OWNCLOUD_SERVER, "");
    }


    /**
     * OwnCloud username for auto send
     */
    @ProfilePreference(name = PreferenceNames.OWNCLOUD_USERNAME)
    public String getOwnCloudUsername() {
        return prefs.getString(PreferenceNames.OWNCLOUD_USERNAME, "");
    }


    /**
     * OwnCloud password for auto send
     */
    @ProfilePreference(name = PreferenceNames.OWNCLOUD_PASSWORD)
    public String getOwnCloudPassword() {
        return prefs.getString(PreferenceNames.OWNCLOUD_PASSWORD, "");
    }


    /**
     * OwnCloud target directory for autosend
     */
    @ProfilePreference(name = PreferenceNames.OWNCLOUD_DIRECTORY)
    public String getOwnCloudDirectory() {
        return prefs.getString(PreferenceNames.OWNCLOUD_DIRECTORY, "/gpslogger");
    }


    /**
     * Whether to auto send to OwnCloud
     */
    @ProfilePreference(name = PreferenceNames.AUTOSEND_OWNCLOUD_ENABLED)
    public boolean isOwnCloudAutoSendEnabled() {
        return prefs.getBoolean(PreferenceNames.AUTOSEND_OWNCLOUD_ENABLED, false);
    }


    /**
     * Whether to prefix the phone's serial number to the logging file
     */
    @ProfilePreference(name = PreferenceNames.PREFIX_SERIAL_TO_FILENAME)
    public boolean shouldPrefixSerialToFileName() {
        return prefs.getBoolean(PreferenceNames.PREFIX_SERIAL_TO_FILENAME, false);
    }


    /**
     * Whether to detect user activity and if the user is still, pause logging
     */
    @ProfilePreference(name = PreferenceNames.ACTIVITYRECOGNITION_DONTLOGIFSTILL)
    public boolean shouldNotLogIfUserIsStill() {
        return prefs.getBoolean(PreferenceNames.ACTIVITYRECOGNITION_DONTLOGIFSTILL, false);
    }


    /**
     * Whether to subtract GeoID height from the reported altitude to get Mean Sea Level altitude instead of WGS84
     */
    @ProfilePreference(name = PreferenceNames.ALTITUDE_SHOULD_ADJUST)
    public boolean shouldAdjustAltitudeFromGeoIdHeight() {
        return prefs.getBoolean(PreferenceNames.ALTITUDE_SHOULD_ADJUST, false);
    }


    /**
     * How much to subtract from the altitude reported
     */
    @ProfilePreference(name = PreferenceNames.ALTITUDE_SUBTRACT_OFFSET)
    public int getSubtractAltitudeOffset() {
        return Strings.toInt(prefs.getString(PreferenceNames.ALTITUDE_SUBTRACT_OFFSET, "0"), 0);
    }


    /**
     * Whether to autosend only if wifi is enabled
     */
    @ProfilePreference(name = PreferenceNames.AUTOSEND_WIFI_ONLY)
    public boolean shouldAutoSendOnWifiOnly() {
        return prefs.getBoolean(PreferenceNames.AUTOSEND_WIFI_ONLY, false);
    }


    @ProfilePreference(name = PreferenceNames.CURRENT_PROFILE_NAME)
    public String getCurrentProfileName() {
        return prefs.getString(PreferenceNames.CURRENT_PROFILE_NAME, AppSettings.getInstance().getString(R.string.profile_default));
    }

    public void setCurrentProfileName(String profileName) {
        prefs.edit().putString(PreferenceNames.CURRENT_PROFILE_NAME, profileName).apply();
    }

    /**
     * A preference to keep track of version specific changes.
     */
    @ProfilePreference(name = PreferenceNames.LAST_VERSION_SEEN_BY_USER)
    public int getLastVersionSeen() {
        return Strings.toInt(prefs.getString(PreferenceNames.LAST_VERSION_SEEN_BY_USER, "1"), 1);
    }

    public void setLastVersionSeen(int lastVersionSeen) {
        prefs.edit().putString(PreferenceNames.LAST_VERSION_SEEN_BY_USER, String.valueOf(lastVersionSeen)).apply();
    }


    public void savePropertiesFromPreferences(File f) throws IOException {

        Properties props = new Properties();

        Method[] methods = PreferenceHelper.class.getMethods();
        for (Method m : methods) {

            Annotation a = m.getAnnotation(ProfilePreference.class);
            if (a != null) {
                try {
                    Object val = m.invoke(this);

                    if (val != null) {

                        if (((ProfilePreference) a).name().equals("listeners")) {
                            String listeners = "";
                            Set<String> chosenListeners = (Set<String>) val;
                            StringBuilder sbListeners = new StringBuilder();
                            for (String l : chosenListeners) {
                                sbListeners.append(l);
                                sbListeners.append(",");
                            }
                            if (sbListeners.length() > 0) {
                                listeners = sbListeners.substring(0, sbListeners.length() - 1);
                            }
                            LOG.debug("LISTENERS - " + listeners);
                            props.setProperty("listeners", listeners);
                        } else {
                            props.setProperty(((ProfilePreference) a).name(), String.valueOf(val));
                            LOG.debug(((ProfilePreference) a).name() + " : " + String.valueOf(val));
                        }
                    } else {
                        LOG.debug("Null value: " + ((ProfilePreference) a).name() + " is null.");
                    }

                } catch (Exception e) {
                    LOG.error("Could not save preferences to profile", e);
                }
            }
        }

        OutputStream outStream = new FileOutputStream(f);
        props.store(outStream, "Warning: This file can contain server names, passwords, email addresses and other sensitive information.");

    }


    /**
     * Sets preferences in a generic manner from a .properties file
     */

    public void setPreferenceFromPropertiesFile(File file) throws IOException {
        Properties props = new Properties();
        InputStreamReader reader = new InputStreamReader(new FileInputStream(file));
        props.load(reader);

        for (Object key : props.keySet()) {

            SharedPreferences.Editor editor = prefs.edit();
            String value = props.getProperty(key.toString());
            LOG.info("Setting preset property: " + key.toString() + " to " + value.toString());

            if (value.equalsIgnoreCase("true") || value.equalsIgnoreCase("false")) {
                editor.putBoolean(key.toString(), Boolean.parseBoolean(value));
            } else if (key.equals("listeners")) {
                List<String> availableListeners = getAvailableListeners();
                Set<String> chosenListeners = new HashSet<>();
                String[] csvListeners = value.split(",");
                for (String l : csvListeners) {
                    if (availableListeners.contains(l)) {
                        chosenListeners.add(l);
                    }
                }
                if (chosenListeners.size() > 0) {
                    prefs.edit().putStringSet("listeners", chosenListeners).apply();
                }

            } else {
                editor.putString(key.toString(), value);
            }
            editor.apply();
        }

    }


}
