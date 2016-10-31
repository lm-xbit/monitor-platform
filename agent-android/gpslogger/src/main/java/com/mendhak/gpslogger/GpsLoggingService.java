/*
*    This file is part of GPSLogger for Android.
*
*    GPSLogger for Android is free software: you can redistribute it and/or modify
*    it under the terms of the GNU General Public License as published by
*    the Free Software Foundation, either version 2 of the License, or
*    (at your option) any later version.
*
*    GPSLogger for Android is distributed in the hope that it will be useful,
*    but WITHOUT ANY WARRANTY; without even the implied warranty of
*    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*    GNU General Public License for more details.
*
*    You should have received a copy of the GNU General Public License
*    along with GPSLogger for Android.  If not, see <http://www.gnu.org/licenses/>.
*/

//TODO: Simplify email logic (too many methods)

package com.mendhak.gpslogger;

import android.annotation.TargetApi;
import android.app.*;
import android.content.Intent;
import android.graphics.BitmapFactory;
import android.location.Location;
import android.location.LocationManager;
import android.location.LocationProvider;
import android.os.*;
import android.support.v4.app.NotificationCompat;
import android.support.v4.app.TaskStackBuilder;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.location.ActivityRecognition;
import com.google.android.gms.location.ActivityRecognitionResult;
import com.google.android.gms.location.DetectedActivity;
import com.mendhak.gpslogger.common.*;
import com.mendhak.gpslogger.common.events.CommandEvents;
import com.mendhak.gpslogger.common.events.ProfileEvents;
import com.mendhak.gpslogger.common.events.ServiceEvents;
import com.mendhak.gpslogger.common.slf4j.Logs;
import com.mendhak.gpslogger.common.slf4j.SessionLogcatAppender;
import com.mendhak.gpslogger.loggers.Files;
import com.mendhak.gpslogger.receivers.PeriodicTaskReceiver;
import com.mendhak.gpslogger.utils.GPSUtil;
import de.greenrobot.event.EventBus;
import org.slf4j.Logger;

import java.io.File;
import java.io.IOException;
import java.text.DecimalFormat;
import java.text.NumberFormat;

/**
 * There are actually three kinds of location provider 1. GPS: this is the most accurate but power consuming provider 2. Network: this is less
 * accurate but also more power saving provider 3. Passive: this is a passive location receiver by consuming just few power
 *
 * So our strategy is 1. we try to collect a location on predefined interval (5 seconds) 2. during this interval, we may have GPS location, network
 * location or passive location, we compare and select the best location (most accurate one) 3. we have different requesting intervals for different
 * provider: a. for GPS we try to request it on one minute basis (configurable) b. for network, we try to request it more frequently like 15 seconds
 * c. for passive provider, we always receive it and save the best result for choosing
 */
public class GpsLoggingService extends Service {
    private static final int ACTIVITY_UNKNOWN = 0;
    private static final int ACTIVITY_STILL = 1;
    private static final int ACTIVITY_MOVE_SLOWLY = 2;
    private static final int ACTIVITY_MOVE_QUICKLY = 3;

    private static NotificationManager notificationManager;
    private static int NOTIFICATION_ID = 8675309;
    private final IBinder binder = new GpsLoggingBinder();
    private NotificationCompat.Builder nfc = null;

    private int activity = ACTIVITY_UNKNOWN;
    private long lastActivityDetectedEpoch = System.currentTimeMillis();


    private static final Logger LOG = Logs.of(GpsLoggingService.class);

    // ---------------------------------------------------
    // Helpers and managers
    // ---------------------------------------------------
    private PreferenceHelper preferenceHelper = PreferenceHelper.getInstance();

    // We have only one location manager
    protected LocationManager locationManager;
    protected AlarmManager alarmManager;

    private LocationClient gpsLocationClient;
    private LocationClient nwLocationClient;
    private Handler handler = new Handler();

    /**
     * Periodic task to report data ...
     */
    PeriodicTaskReceiver periodicTaskReceiver = new PeriodicTaskReceiver(this);

    private GeneralLocationListener generalListener;
    private Location gpsLocation = null;
    private Location cellLocation = null;
    private Location passiveLocation = null;

    PendingIntent activityRecognitionPendingIntent;
    GoogleApiClient googleApiClient;
    // ---------------------------------------------------

    @Override
    public IBinder onBind(Intent arg0) {
        return binder;
    }

    @Override
    public void onCreate() {
        registerEventBus();

        /**
         * Start receiver
         */
        periodicTaskReceiver.initialize();
    }

    /**
     * Start current available location clients
     *
     * TODO: we shall enable faster GPS polling on direction from UI, but for now let's fix this to 30 minutes or so to acquire a more accurate update
     * from GPS
     *
     * TODO: we shall use a more intelligent way to acquire network location according to activity detected. Current following hard-coded logic will
     * be followed 1. if user is still, let's request network position for 15 minutes 2. if user is moving slowly (walking, etc.) let's request
     * network position every 1 minutes or so 3. if user is moving quickly let's request the location update every 15 seconds or so
     */
    private void startLocationClients() {
        if (!checkLocationProviderStatus()) {
            Session.setStatus("No location provider available!");
            setLocationServiceUnavailable();
            return;
        }

        if (gpsLocationClient == null) {
            gpsLocationClient = new LocationClient(LocationManager.GPS_PROVIDER, locationManager, this);
        }

        LOG.info("Try starting GPS location client, GPS enabled? " + Session.isGpsEnabled());
        if (Session.isGpsEnabled()) {
            gpsLocationClient.start(30 * 60 * 1000, 200);
        }

        if (nwLocationClient == null) {
            nwLocationClient = new LocationClient(LocationManager.NETWORK_PROVIDER, locationManager, this);
        }


        LOG.info("Try starting NETWORK location client, NETWORK enabled? " + Session.isTowerEnabled());
        if (Session.isTowerEnabled()) {
            nwLocationClient.start(120 * 1000, 0);
        }

        if (Session.isGpsEnabled() && Session.isTowerEnabled()) {
            Session.setStatus("Will use GPS and Network positions");
        } else if (Session.isGpsEnabled()) {
            Session.setStatus("Will only use GPS positions");
        } else {
            Session.setStatus("Will only use Network positions");
        }
    }

    /**
     * Stop current location clients, except the passive one
     */
    private void stopLocationClients() {
        if (gpsLocationClient != null) {
            gpsLocationClient.stop();
        }

        if (nwLocationClient != null) {
            nwLocationClient.stop();
        }
    }

    private void requestActivityRecognitionUpdates() {
        GoogleApiClient.Builder builder = new GoogleApiClient.Builder(getApplicationContext()).addApi(ActivityRecognition.API)
                .addConnectionCallbacks(new GoogleApiClient.ConnectionCallbacks() {

            @Override
            public void onConnectionSuspended(int arg) {
            }

            @Override
            public void onConnected(Bundle arg0) {
                try {
                    LOG.debug("Requesting activity recognition updates");
                    Intent intent = new Intent(getApplicationContext(), GpsLoggingService.class);
                    activityRecognitionPendingIntent = PendingIntent.getService(getApplicationContext(), 0, intent, PendingIntent
                            .FLAG_UPDATE_CURRENT);
                    ActivityRecognition.ActivityRecognitionApi.requestActivityUpdates(googleApiClient, preferenceHelper.getMinimumLoggingInterval()
                            * 1000, activityRecognitionPendingIntent);
                } catch (Throwable t) {
                    LOG.warn(SessionLogcatAppender.MARKER_INTERNAL, "Can't connect to activity recognition service", t);
                }

            }

        }).addOnConnectionFailedListener(new GoogleApiClient.OnConnectionFailedListener() {
            @Override
            public void onConnectionFailed(ConnectionResult arg0) {

            }
        });

        googleApiClient = builder.build();
        googleApiClient.connect();
    }

    private void stopActivityRecognitionUpdates() {
        try {
            LOG.debug("Stopping activity recognition updates");
            if (googleApiClient != null && googleApiClient.isConnected()) {
                ActivityRecognition.ActivityRecognitionApi.removeActivityUpdates(googleApiClient, activityRecognitionPendingIntent);
                googleApiClient.disconnect();
            }
        } catch (Throwable t) {
            LOG.warn(SessionLogcatAppender.MARKER_INTERNAL, "Tried to stop activity recognition updates", t);
        }

    }

    private void registerEventBus() {
        EventBus.getDefault().registerSticky(this);
    }

    private void unregisterEventBus() {
        try {
            EventBus.getDefault().unregister(this);
        } catch (Throwable t) {
            //this may crash if registration did not go through. just be safe
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        handleIntent(intent);

        return START_REDELIVER_INTENT;
    }

    @Override
    public void onDestroy() {
        LOG.warn(SessionLogcatAppender.MARKER_INTERNAL, "GpsLoggingService is being destroyed by Android OS.");
        unregisterEventBus();
        removeNotification();
        super.onDestroy();
    }

    @Override
    public void onLowMemory() {
        LOG.error("Android is low on memory!");
        super.onLowMemory();
    }

    //
    // Cancel alarm for a given location client
    public void cancelAlarmForNextPoint(LocationClient lc) {
        if (alarmManager == null) {
            LOG.error("Alarm manager not ready. Possibly not started.");
            return;
        }

        Intent intent = new Intent(this, GpsLoggingService.class);
        intent.putExtra("provider", lc.getProvider());
        PendingIntent pi = PendingIntent.getService(this, 0, intent, 0);
        alarmManager.cancel(pi);
    }

    @TargetApi(23)
    private void setAlarmForNextPoint(LocationClient lc, int interval) {
        LOG.debug("Set alarm for " + preferenceHelper.getMinimumLoggingInterval() + " seconds");

        Intent intent = new Intent(this, GpsLoggingService.class);
        intent.putExtra("provider", lc.getProvider());
        PendingIntent pi = PendingIntent.getService(this, 0, intent, 0);
        alarmManager.cancel(pi);

        if (Systems.isDozing(this)) {
            //Only invoked once per 15 minutes in doze mode
            LOG.info("Device is dozing, using infrequent alarm");
            alarmManager.setAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, SystemClock.elapsedRealtime() + interval, pi);
        } else {
            alarmManager.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, SystemClock.elapsedRealtime() + interval, pi);
        }
    }

    private void handleIntent(Intent intent) {
        LOG.info("handleIntent---->Intent received.");
        ActivityRecognitionResult arr = ActivityRecognitionResult.extractResult(intent);
        if (arr != null) {
            int activity = ACTIVITY_UNKNOWN;

            String detectedActivity = "";
            LOG.info("handleIntent---->ActivityRecognitionResult:" + arr.getMostProbableActivity().getType());

            switch (arr.getMostProbableActivity().getType()) {
                case DetectedActivity.IN_VEHICLE:
                    activity = ACTIVITY_MOVE_QUICKLY;
                    detectedActivity = getString(R.string.activity_in_vehicle);
                    break;
                case DetectedActivity.STILL:
                    activity = ACTIVITY_STILL;
                    detectedActivity = getString(R.string.activity_still);
                    break;
                case DetectedActivity.ON_BICYCLE:
                    activity = ACTIVITY_MOVE_QUICKLY;
                    detectedActivity = getString(R.string.activity_on_bicycle);
                    break;
                case DetectedActivity.ON_FOOT:
                    activity = ACTIVITY_MOVE_SLOWLY;
                    detectedActivity = getString(R.string.activity_on_foot);
                    break;
                case DetectedActivity.RUNNING:
                    activity = ACTIVITY_MOVE_QUICKLY;
                    detectedActivity = getString(R.string.activity_running);
                    break;
                case DetectedActivity.TILTING:
                    activity = ACTIVITY_MOVE_SLOWLY;
                    detectedActivity = getString(R.string.activity_tilting);
                    break;
                case DetectedActivity.WALKING:
                    activity = ACTIVITY_MOVE_QUICKLY;
                    detectedActivity = getString(R.string.activity_walking);
                    break;
                // case DetectedActivity.UNKNOWN:
                default:
                    activity = ACTIVITY_UNKNOWN;
                    detectedActivity = getString(R.string.activity_unknown);
                    break;
            }

            Session.setActivity(detectedActivity, arr.getMostProbableActivity().getConfidence());
            EventBus.getDefault().post(new ServiceEvents.ActivityRecognitionEvent(arr));


            if (this.activity != activity) {
                lastActivityDetectedEpoch = System.currentTimeMillis();
                LOG.info("Detected user STILL still at - " + activity);
                this.activity = activity;
            }

            if ((System.currentTimeMillis() - lastActivityDetectedEpoch) > 60 * 1000) {
                LOG.info("User activity changed for a longer period! Let's change sampling frequency");
                switch (this.activity) {
                    case ACTIVITY_STILL:
                        // every 15 minutes
                        nwLocationClient.start(15 * 60 * 1000, 0);
                        break;
                    case ACTIVITY_MOVE_SLOWLY:
                        // every 1 minutes
                        nwLocationClient.start(60 * 1000, 0);
                        break;
                    case ACTIVITY_MOVE_QUICKLY:
                        // every 15 seconds
                        nwLocationClient.start(15 * 1000, 0);
                        break;
                    default:
                        // case ACTIVITY_UNKNOWN:
                        // every 1 minutes
                        nwLocationClient.start(60 * 1000, 0);
                        break;
                }
            }


            return;
        }

        if (intent != null) {
            Bundle bundle = intent.getExtras();

            if (bundle != null) {
                if (bundle.getBoolean(IntentConstants.IMMEDIATE_START)) {
                    LOG.info("Intent received - Start Logging Now");
                    EventBus.getDefault().postSticky(new CommandEvents.RequestStartStop(true));
                }

                if (bundle.getBoolean(IntentConstants.IMMEDIATE_STOP)) {
                    LOG.info("Intent received - Stop logging now");
                    EventBus.getDefault().postSticky(new CommandEvents.RequestStartStop(false));
                }

                if (bundle.getBoolean(IntentConstants.GET_NEXT_POINT)) {
                    // see which provider shall be ...
                }
            } else {
                LOG.debug("Service restarted with null bundle.");
            }
        } else {
            // A null intent is passed in if the service has been killed and restarted.
            LOG.debug("Service restarted with null intent. Start logging.");
            startLogging();
        }
    }

    /**
     * Resets the form, resets file name if required, reobtains preferences
     */
    protected void startLogging() {
        Session.setAddNewTrackSegment(true);

        if (Session.isStarted()) {
            LOG.debug("Session already started, ignoring");
            return;
        }

        LOG.info("########Start GPS Logging ....");

        try {
            startForeground(NOTIFICATION_ID, new Notification());
        } catch (Exception ex) {
            LOG.error("Could not start GPSLoggingService in foreground. ", ex);
        }

        locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
        alarmManager = (AlarmManager) getSystemService(ALARM_SERVICE);

        Session.setStarted(true);

        showNotification();
        notifyClientStarted();
        requestActivityRecognitionUpdates();

        startLocationClients();

        periodicTaskReceiver.startReportTimer();
        // We can gather sample at 5 seconds minimum
        handler.postDelayed(startGatherLocRunnable, 5 * 1000);

        if (generalListener == null) {
            generalListener = new GeneralLocationListener(this, "");
        }

        /**
         * The general listener listens for passive updates as well as for GPS status changing ...
         */
        try {
            locationManager.requestLocationUpdates(LocationManager.PASSIVE_PROVIDER, 0, 0, generalListener);
            passiveLocation = locationManager.getLastKnownLocation(LocationManager.PASSIVE_PROVIDER);
            locationManager.addGpsStatusListener(generalListener);
            locationManager.addNmeaListener(generalListener);
        } catch (SecurityException se) {
            LOG.error("No GPS and NMEA message available");
        }
    }

    //We can gather sample at 5 seconds minimum
    private Runnable startGatherLocRunnable = new Runnable() {
        @Override
        public void run() {
            periodicTaskReceiver.collectLocationSample();
            handler.postDelayed(startGatherLocRunnable, 5 * 1000);
        }
    };

    /**
     * Asks the main service client to clear its form.
     */
    private void notifyClientStarted() {
        LOG.info(getString(R.string.started));
        EventBus.getDefault().post(new ServiceEvents.LoggingStatus(true));
    }

    /**
     * Stops logging, removes notification, stops GPS manager, stops email timer
     */
    public void stopLogging() {
        LOG.debug(".");
        Session.setAddNewTrackSegment(true);
        Session.setTotalTravelled(0);
        Session.setPreviousLocationInfo(null);
        Session.setStarted(false);
        Session.setUserStillSinceTimeStamp(0);
        Session.setLatestTimeStamp(0);

        periodicTaskReceiver.stopReportTimer();
        handler.removeCallbacks(startGatherLocRunnable);

        stopLocationClients();

        if (generalListener != null) {
            try {
                locationManager.removeUpdates(generalListener);
                locationManager.removeGpsStatusListener(generalListener);
                locationManager.removeNmeaListener(generalListener);
            } catch (SecurityException se) {
                // ignore
            }
        }

        Session.setCurrentLocationInfo(null);
        Session.setSinglePointMode(false);
        stopForeground(true);

        removeNotification();

        stopActivityRecognitionUpdates();
        notifyClientStopped();
    }

    /**
     * Hides the notification icon in the status bar if it's visible.
     */
    private void removeNotification() {
        notificationManager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        notificationManager.cancelAll();
    }

    /**
     * Shows a notification icon in the status bar for GPS Logger
     */
    private void showNotification() {
        Intent stopLoggingIntent = new Intent(this, GpsLoggingService.class);
        stopLoggingIntent.setAction("NotificationButton_STOP");
        stopLoggingIntent.putExtra(IntentConstants.IMMEDIATE_STOP, true);
        PendingIntent piStop = PendingIntent.getService(this, 0, stopLoggingIntent, 0);

        Intent annotateIntent = new Intent(this, NotificationAnnotationActivity.class);
        annotateIntent.setAction("com.mendhak.gpslogger.NOTIFICATION_BUTTON");
        PendingIntent piAnnotate = PendingIntent.getActivity(this, 0, annotateIntent, 0);

        // What happens when the notification item is clicked
        Intent contentIntent = new Intent(this, GpsMainActivity.class);

        TaskStackBuilder stackBuilder = TaskStackBuilder.create(this);
        stackBuilder.addNextIntent(contentIntent);

        PendingIntent pending = stackBuilder.getPendingIntent(0, PendingIntent.FLAG_UPDATE_CURRENT);


        NumberFormat nf = new DecimalFormat("###.#####");

        String contentText = getString(R.string.gpslogger_still_running);
        long notificationTime = System.currentTimeMillis();

        if (Session.hasValidLocation()) {
            contentText = getString(R.string.txt_latitude_short) + ": " + nf.format(Session.getCurrentLatitude()) + ", " + getString(R.string
                    .txt_longitude_short) + ": " + nf.format(Session.getCurrentLongitude());

            notificationTime = Session.getCurrentLocationInfo().getTime();
        }

        if (nfc == null) {
            nfc = new NotificationCompat.Builder(getApplicationContext()).setSmallIcon(R.drawable.notification).setLargeIcon(BitmapFactory
                    .decodeResource(getResources(), R.drawable.gpsloggericon3)).setPriority(Notification.PRIORITY_MAX).setContentTitle(contentText)
                    .setOngoing(true).setContentIntent(pending);

            if (!preferenceHelper.shouldHideNotificationButtons()) {
                nfc.addAction(R.drawable.annotate2, getString(R.string.menu_annotate), piAnnotate).addAction(android.R.drawable
                        .ic_menu_close_clear_cancel, getString(R.string.shortcut_stop), piStop);
            }
        }


        nfc.setContentTitle(contentText);
        nfc.setContentText(getString(R.string.app_name));
        nfc.setWhen(notificationTime);

        notificationManager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        notificationManager.notify(NOTIFICATION_ID, nfc.build());
    }

    /*
    private Runnable collectLocationRunnable = new Runnable() {
        @Override
        public void run() {
            try {
                job();
            }
            finally {
                // do the job again
                handler.postDelayed(collectLocationRunnable, 5000);
            }
        }

        private void job() {
            String provider = "GPS";
            Location loc = gpsLocation;

            if(loc == null) {
                loc = passiveLocation;
                provider = "PASSIVE";
            }
            else if(GPSUtil.isBetterLocation(passiveLocation, loc)) {
                loc = passiveLocation;
                provider = "PASSIVE";
            }

            if(loc == null) {
                loc = cellLocation;
                provider = "CELL";
            }
            else if(GPSUtil.isBetterLocation(cellLocation, loc)) {
                loc = cellLocation;
                provider = "CELL";
            }

            if(loc == null) {
                // No location found
                Session.setStatus("No valid location in current sampling cycle");
            }
            else {
                Session.setStatus(String.format("Use location from %s provider", provider));

                LOG.info(SessionLogcatAppender.MARKER_LOCATION, String.valueOf(loc.getLatitude()) + "," + String.valueOf(loc.getLongitude()));
                if (loc.hasAltitude()) {
                    adjustAltitude(loc);
                }

                //
                // We may have request both GPS and CELL location, so if GPS is enabled, we shall favor GPS location
                //
                Session.setLatestTimeStamp(System.currentTimeMillis());
                Session.setCurrentLocationInfo(loc);
                setDistanceTraveled(loc);
                showNotification();

                EventBus.getDefault().post(new ServiceEvents.LocationUpdate(loc));
                periodicTaskReceiver.collectLocationSample(GpsLoggingService.this);
            }
        }
    }
    */

    /**
     * Check if user has enabled / disabled the location services.
     *
     * Return true if any of the location service has been enabled, false otherwise
     */
    private boolean checkLocationProviderStatus() {
        boolean towerEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
        Session.setTowerEnabled(towerEnabled);

        boolean gpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER);
        Session.setGpsEnabled(gpsEnabled);

        LOG.info(String.format("NETWORK location manager is available? %s, GPS location manager is available? %s", towerEnabled, gpsEnabled));

        return towerEnabled || gpsEnabled;
    }


    void setLocationServiceUnavailable() {
        EventBus.getDefault().post(new ServiceEvents.LocationServicesUnavailable());
    }


    /**
     * Notifies main form that logging has stopped
     */
    void notifyClientStopped() {
        LOG.info(getString(R.string.stopped));
        EventBus.getDefault().post(new ServiceEvents.LoggingStatus(false));
    }

    /**
     * This event is raised when the GeneralLocationListener has a new location. This method in turn updates notification, writes to file, reobtains
     * preferences, notifies main service client and resets location managers.
     *
     * If this is a passive location, we simply record it (unless we are requesting updates) otherwise, we need to favor the location updates in
     * following order: GPS location > Cell location > Passive Location
     *
     * @param loc
     *         Location object
     */
    void onLocationChanged(LocationClient client, Location loc) {
        if (client == null) {
            // this is passive ...
            passiveLocation = loc;
            Session.setStatus("Passive provider got a location - " + loc);
        } else {
            String provider = client.getProvider();

            if ("GPS".equalsIgnoreCase(provider)) {
                gpsLocation = loc;
                Session.setStatus("GPS provider got a location - " + loc);
            } else if ("CELL".equalsIgnoreCase(provider)) {
                cellLocation = loc;
                Session.setStatus("Network provider got a location - " + loc);
            }
        }

        if (GPSUtil.isBetterLocation(loc, Session.getCurrentLocationInfo())) {
            adjustAltitude(loc);

            Session.setLatestTimeStamp(System.currentTimeMillis());
            Session.setCurrentLocationInfo(loc);

            setDistanceTraveled(loc);
            showNotification();

            EventBus.getDefault().post(new ServiceEvents.LocationUpdate(loc));
        }
    }

    void onStatusChanged(LocationClient client, int status, Bundle extra) {
        if (status == LocationProvider.AVAILABLE) {
            Session.setStatus("Provider " + client.getProvider() + " is available");
            // client.start();
        } else {
            Session.setStatus("Provider " + client.getProvider() + " is unavailable");
            // client.stop();
        }
    }

    void onProviderEnabled(LocationClient client) {
        Session.setStatus("Provider " + client.getProvider() + " is enabled");
        // client.start();
    }

    void onProviderDisabled(LocationClient client) {
        Session.setStatus("Provider " + client.getProvider() + " is disabled");
        // client.stop();
    }

    /**
     * Stops location manager, then starts it.
     */
    void restartLogging() {
        LOG.debug("Restarting location logging ...");

        stopLocationClients();
        startLocationClients();
    }

    private void adjustAltitude(Location loc) {
        if (preferenceHelper.shouldAdjustAltitudeFromGeoIdHeight() && loc.getExtras() != null) {
            String geoidheight = loc.getExtras().getString("GEOIDHEIGHT");
            if (!Strings.isNullOrEmpty(geoidheight)) {
                loc.setAltitude((float) loc.getAltitude() - Float.valueOf(geoidheight));
            } else {
                //If geoid height not present for adjustment, don't record an elevation at all.
                loc.removeAltitude();
            }
        }

        if (loc.hasAltitude()) {
            loc.setAltitude(loc.getAltitude() - preferenceHelper.getSubtractAltitudeOffset());
        }
    }

    private void setDistanceTraveled(Location loc) {
        // Distance
        if (Session.getPreviousLocationInfo() == null) {
            Session.setPreviousLocationInfo(loc);
        }

        // Calculate this location and the previous location location and add to the current r《unning total distance.
        // NOTE: Should be used in conjunction with 'distance required before logging' for more realistic values.
        double distance = Maths.calculateDistance(Session.getPreviousLatitude(), Session.getPreviousLongitude(), loc.getLatitude(), loc
                .getLongitude());
        Session.setPreviousLocationInfo(loc);
        Session.setTotalTravelled(Session.getTotalTravelled() + distance);
    }

    /**
     * Informs the main service client of the number of visible satellites.
     *
     * @param count
     *         Number of Satellites
     */
    void setSatelliteInfo(int count) {
        Session.setVisibleSatelliteCount(count);
        EventBus.getDefault().post(new ServiceEvents.SatellitesVisible(count));
    }

    public void onNmeaSentence(long timestamp, String nmeaSentence) {
        // DO NOTHING
    }

    /**
     * Can be used from calling classes as the go-between for methods and properties.
     */
    public class GpsLoggingBinder extends Binder {
        public GpsLoggingService getService() {
            return GpsLoggingService.this;
        }
    }


    @EventBusHook
    public void onEvent(CommandEvents.RequestToggle requestToggle) {
        if (Session.isStarted()) {
            stopLogging();
        } else {
            startLogging();
        }
    }

    @EventBusHook
    public void onEvent(CommandEvents.RequestStartStop startStop) {
        if (startStop.start) {
            startLogging();
        } else {
            stopLogging();
        }

        EventBus.getDefault().removeStickyEvent(CommandEvents.RequestStartStop.class);
    }

    @EventBusHook
    public void onEvent(CommandEvents.Annotate annotate) {
        final String desc = Strings.cleanDescription(annotate.annotation);
        if (desc.length() == 0) {
            LOG.debug("Clearing annotation");
            Session.clearDescription();
        } else {
            LOG.debug("Pending annotation: " + desc);
            Session.setDescription(desc);
            EventBus.getDefault().post(new ServiceEvents.AnnotationStatus(false));
        }

        EventBus.getDefault().removeStickyEvent(CommandEvents.Annotate.class);
    }

    @EventBusHook
    public void onEvent(ServiceEvents.ActivityRecognitionEvent activityRecognitionEvent) {

        if (!preferenceHelper.shouldNotLogIfUserIsStill()) {
            Session.setUserStillSinceTimeStamp(0);
            return;
        }

        if (activityRecognitionEvent.result.getMostProbableActivity().getType() == DetectedActivity.STILL) {
            LOG.debug(activityRecognitionEvent.result.getMostProbableActivity().toString());
            if (Session.getUserStillSinceTimeStamp() == 0) {
                LOG.debug("Just entered still state, attempt to log");
                Session.setUserStillSinceTimeStamp(System.currentTimeMillis());
            }

        } else {
            LOG.debug(activityRecognitionEvent.result.getMostProbableActivity().toString());
            //Reset the still-since timestamp
            Session.setUserStillSinceTimeStamp(0);
            LOG.debug("Just exited still state, attempt to log");
        }
    }

    @EventBusHook
    public void onEvent(ProfileEvents.SwitchToProfile switchToProfileEvent) {
        try {

            if (preferenceHelper.getCurrentProfileName().equals(switchToProfileEvent.newProfileName)) {
                return;
            }

            LOG.debug("Switching to profile: " + switchToProfileEvent.newProfileName);

            //Save the current settings to a file (overwrite)
            File f = new File(Files.storageFolder(GpsLoggingService.this), preferenceHelper.getCurrentProfileName() + ".properties");
            preferenceHelper.savePropertiesFromPreferences(f);

            //Read from a possibly existing file and load those preferences in
            File newProfile = new File(Files.storageFolder(GpsLoggingService.this), switchToProfileEvent.newProfileName + ".properties");
            if (newProfile.exists()) {
                preferenceHelper.setPreferenceFromPropertiesFile(newProfile);
            }

            //Switch current profile name
            preferenceHelper.setCurrentProfileName(switchToProfileEvent.newProfileName);

        } catch (IOException e) {
            LOG.error("Could not save profile to file", e);
        }
    }

    @EventBusHook
    public void onEvent(ProfileEvents.UpdatePeriodicProfile event) {
        periodicTaskReceiver.updateConfigParams();
    }

    @EventBusHook
    public void onEvent(CommandEvents.Report event) {
        reportData();
        EventBus.getDefault().removeStickyEvent(CommandEvents.Report.class);
    }

    private void reportData(){
        periodicTaskReceiver.tryReportData();
        periodicTaskReceiver.startReportTimer();
    }
}
