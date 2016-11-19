package com.mendhak.gpslogger.common;


public  class PreferenceNames {
    /**
     * preference for mobile tracking
     */
    public static final String MTRACKING_USE_SSL = "mobile_tracking_use_ssl";
    public static final String MTRACKING_ENDPOINT = "mobile_tracking_endpoint";
    public static final String MTRACKING_URI = "mobile_tracking_uri";
    public static final String MTRACKING_REPORT_INTERVAL = "mobile_tracking_report_interval";
    public static final String MTRACKING_APP_KEY = "mobile_tracking_app_key";

    /**
     *
     */
    public static final String MINIMUM_INTERVAL ="time_before_logging";
    public static final String MINIMUM_DISTANCE = "distance_before_logging";
    public static final String MINIMUM_ACCURACY = "accuracy_before_logging";
    public static final String KEEP_GPS_ON_BETWEEN_FIXES = "keep_fix";
    public static final String LOGGING_RETRY_TIME = "retry_time";
    public static final String ABSOLUTE_TIMEOUT = "absolute_timeout";
    public static final String START_LOGGING_ON_APP_LAUNCH = "startonapplaunch";
    public static final String START_LOGGING_ON_BOOTUP = "startonbootup";
    public static final String LOG_TO_KML = "log_kml";
    public static final String LOG_TO_GPX = "log_gpx";
    public static final String LOG_TO_CSV = "log_plain_text";
    public static final String LOG_TO_NMEA = "log_nmea";
    public static final String LOG_TO_URL = "log_customurl_enabled";
    public static final String LOG_TO_URL_PATH = "log_customurl_url";
    public static final String LOG_TO_OPENGTS = "log_opengts";
    public static final String LOCATION_LISTENERS = "listeners";
    public static final String NEW_FILE_CREATION_MODE = "new_file_creation";
    public static final String CUSTOM_FILE_NAME = "new_file_custom_name";
    public static final String ASK_CUSTOM_FILE_NAME = "new_file_custom_each_time";
    public static final String AUTOSEND_ENABLED = "autosend_enabled";
    public static final String AUTOSEND_FREQUENCY = "autosend_frequency_minutes";
    public static final String AUTOSEND_ON_STOP = "autosend_frequency_whenstoppressed";
    public static final String AUTOSEND_EMAIL_ENABLED = "autoemail_enabled";
    public static final String AUTOSEND_ZIP = "autosend_sendzip";
    public static final String AUTOSEND_OPENGTS_ENABLED = "autoopengts_enabled";
    public static final String EMAIL_SMTP_SERVER = "smtp_server";
    public static final String EMAIL_SMTP_PORT = "smtp_port";
    public static final String EMAIL_SMTP_USERNAME = "smtp_username";
    public static final String EMAIL_SMTP_PASSWORD = "smtp_password";

    public static final String EMAIL_SMTP_SSL = "smtp_ssl";
    public static final String EMAIL_TARGET = "autoemail_target";
    public static final String EMAIL_FROM = "smtp_from";
    public static final String DEBUG_TO_FILE = "debugtofile";
    public static final String OPENGTS_SERVER = "opengts_server";
    public static final String OPENGTS_PORT = "opengts_server_port";
    public static final String OPENGTS_PROTOCOL = "opengts_server_communication_method";
    public static final String OPENGTS_SERVER_PATH = "autoopengts_server_path";
    public static final String OPENGTS_DEVICE_ID = "opengts_device_id";
    public static final String OPENGTS_ACCOUNT_NAME = "opengts_accountname";
    public static final String HIDE_NOTIFICATION_BUTTONS = "hide_notification_buttons";
    public static final String DISPLAY_IMPERIAL = "useImperial";
    public static final String AUTOSEND_GOOGLEDRIVE_ENABLED = "gdocs_enabled";
    public static final String GOOGLEDRIVE_FOLDERNAME = "gdocs_foldername";
    public static final String GOOGLEDRIVE_ACCOUNTNAME = "GDRIVE_ACCOUNT_NAME";
    public static final String GOOGLEDRIVE_AUTHTOKEN = "GDRIVE_AUTH_TOKEN";
    public static final String OPENSTREETMAP_ACCESS_TOKEN = "osm_accesstoken";
    public static final String OPENSTREETMAP_ACCESS_TOKEN_SECRET = "osm_accesstokensecret";
    public static final String OPENSTREETMAP_REQUEST_TOKEN = "osm_requesttoken";
    public static final String OPENSTREETMAP_REQUEST_TOKEN_SECRET = "osm_requesttokensecret";
    public static final String OPENSTREETMAP_DESCRIPTION = "osm_description";
    public static final String OPENSTREETMAP_TAGS = "osm_tags";
    public static final String OPENSTREETMAP_VISIBILITY = "osm_visibility";
    public static final String AUTOSEND_DROPBOX_ENABLED = "dropbox_enabled";
    public static final String DROPBOX_ACCESS_KEY = "DROPBOX_ACCESS_KEY";
    public static final String DROPBOX_ACCESS_SECRET = "DROPBOX_ACCESS_SECRET";
    public static final String AUTOSEND_OSM_ENABLED = "osm_enabled";
    public static final String FTP_SERVER = "autoftp_server";
    public static final String FTP_PORT = "autoftp_port";
    public static final String FTP_USERNAME = "autoftp_username";
    public static final String FTP_PASSWORD = "autoftp_password";
    public static final String FTP_USE_FTPS = "autoftp_useftps";
    public static final String FTP_SSLORTLS = "autoftp_ssltls";
    public static final String FTP_IMPLICIT = "autoftp_implicit";
    public static final String AUTOSEND_FTP_ENABLED = "autoftp_enabled";
    public static final String FTP_DIRECTORY = "autoftp_directory";
    public static final String OWNCLOUD_SERVER = "owncloud_server";
    public static final String OWNCLOUD_USERNAME = "owncloud_username";
    public static final String OWNCLOUD_PASSWORD = "owncloud_password";
    public static final String OWNCLOUD_DIRECTORY = "owncloud_directory";
    public static final String AUTOSEND_OWNCLOUD_ENABLED = "owncloud_enabled";
    public static final String GPSLOGGER_FOLDER = "gpslogger_folder";
    public static final String PREFIX_SERIAL_TO_FILENAME = "new_file_prefix_serial";
    public static final String ACTIVITYRECOGNITION_DONTLOGIFSTILL = "activityrecognition_dontlogifstill";
    public static final String ALTITUDE_SUBTRACT_OFFSET = "altitude_subtractoffset";
    public static final String ALTITUDE_SHOULD_ADJUST = "altitude_subtractgeoidheight";
    public static final String AUTOSEND_WIFI_ONLY = "autosend_wifionly";
    public static final String CURRENT_PROFILE_NAME = "current_profile_name";
    public static final String SELECTED_NAVITEM = "selected_navitem";

    public static final String LAST_VERSION_SEEN_BY_USER = "last_version_seen";
}
