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
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.graphics.BitmapFactory;
import android.location.Location;
import android.location.LocationManager;
import android.os.Binder;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.SystemClock;
import android.support.v4.app.NotificationCompat;
import android.support.v4.app.TaskStackBuilder;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.location.ActivityRecognition;
import com.google.android.gms.location.ActivityRecognitionResult;
import com.google.android.gms.location.DetectedActivity;
import com.mendhak.gpslogger.common.EventBusHook;
import com.mendhak.gpslogger.common.IntentConstants;
import com.mendhak.gpslogger.common.Maths;
import com.mendhak.gpslogger.common.PreferenceHelper;
import com.mendhak.gpslogger.common.Session;
import com.mendhak.gpslogger.common.Strings;
import com.mendhak.gpslogger.common.Systems;
import com.mendhak.gpslogger.common.events.CommandEvents;
import com.mendhak.gpslogger.common.events.ProfileEvents;
import com.mendhak.gpslogger.common.events.ServiceEvents;
import com.mendhak.gpslogger.common.slf4j.Logs;
import com.mendhak.gpslogger.common.slf4j.SessionLogcatAppender;
import com.mendhak.gpslogger.loggers.Files;
import com.mendhak.gpslogger.receivers.PeriodicTaskReceiver;
import de.greenrobot.event.EventBus;
import org.slf4j.Logger;

import java.io.File;
import java.io.IOException;
import java.text.DecimalFormat;
import java.text.NumberFormat;

public class GpsLoggingService extends Service {
    private static NotificationManager notificationManager;
    private static int NOTIFICATION_ID = 8675309;
    private final IBinder binder = new GpsLoggingBinder();
    AlarmManager nextPointAlarmManager;
    private NotificationCompat.Builder nfc = null;


    private static final Logger LOG = Logs.of(GpsLoggingService.class);

    // ---------------------------------------------------
    // Helpers and managers
    // ---------------------------------------------------
    private PreferenceHelper preferenceHelper = PreferenceHelper.getInstance();

    // We have only one location manager
    protected LocationManager locationManager;

    // If we have tried to request location update from GPS or CELL provider
    private boolean requestingLocationUpdate = false;

    private GeneralLocationListener gpsLocationListener;
    private GeneralLocationListener towerLocationListener;
    private GeneralLocationListener passiveLocationListener;

    /**
     * Periodic task to report data ...
     */
    PeriodicTaskReceiver periodicTaskReceiver = new PeriodicTaskReceiver();

    private Handler handler = new Handler();
    private Location cellLocation = null;

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

        // return START_REDELIVER_INTENT;
        return START_STICKY;
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

    private void handleIntent(Intent intent) {

        ActivityRecognitionResult arr = ActivityRecognitionResult.extractResult(intent);
        if (arr != null) {
            EventBus.getDefault().post(new ServiceEvents.ActivityRecognitionEvent(arr));
            return;
        }

        if (intent != null) {
            Bundle bundle = intent.getExtras();

            if (bundle != null) {
                boolean shouldRequestLocationUpdate = false;

                if (bundle.getBoolean(IntentConstants.IMMEDIATE_START)) {
                    LOG.info("Intent received - Start Logging Now");
                    EventBus.getDefault().postSticky(new CommandEvents.RequestStartStop(true));
                }

                if (bundle.getBoolean(IntentConstants.IMMEDIATE_STOP)) {
                    LOG.info("Intent received - Stop logging now");
                    EventBus.getDefault().postSticky(new CommandEvents.RequestStartStop(false));
                }

                if (bundle.getBoolean(IntentConstants.GET_NEXT_POINT)) {
                    LOG.info("Intent received - Get Next Point: Location manager started? " + requestingLocationUpdate + " By: " + this);
                    shouldRequestLocationUpdate = true;
                }

                if (bundle.getString(IntentConstants.SET_DESCRIPTION) != null) {
                    LOG.info("Intent received - Set Next Point Description: " + bundle.getString(IntentConstants.SET_DESCRIPTION));
                    EventBus.getDefault().post(new CommandEvents.Annotate(bundle.getString(IntentConstants.SET_DESCRIPTION)));
                }

                if (bundle.get(IntentConstants.ABSOLUTE_TIMEOUT) != null) {
                    int absoluteTimeout = bundle.getInt(IntentConstants.ABSOLUTE_TIMEOUT);
                    LOG.debug("Intent received - Set Retry Time: " + String.valueOf(absoluteTimeout));
                    preferenceHelper.setAbsoluteTimeoutForAcquiringPosition(absoluteTimeout);
                    shouldRequestLocationUpdate = true;
                }

                if (shouldRequestLocationUpdate && Session.isStarted()) {
                    requestLocationUpdate();
                }
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
        nextPointAlarmManager = (AlarmManager) getSystemService(ALARM_SERVICE);

        Session.setStarted(true);

        showNotification();
        notifyClientStarted();
        startPassiveManager();
        requestLocationUpdate();
        requestActivityRecognitionUpdates();

        periodicTaskReceiver.startPeriodicTaskHeartBeat(this);
    }

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
        handler.removeCallbacks(timeoutLocationUpdateRunnable);

        Session.setCurrentLocationInfo(null);
        Session.setSinglePointMode(false);
        stopForeground(true);

        removeNotification();
        cancelAlarmForNextPoint();
        stopLocationUpdate();
        stopPassiveManager();
        stopActivityRecognitionUpdates();
        notifyClientStopped();

        cellLocation = null;
        periodicTaskReceiver.stopPeriodicTaskHeartBeat(this);
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

    /**
     * Passive location listener are started / stopped automatically with start / stop of logging service
     * @throws SecurityException
     */
    private void startPassiveManager() throws SecurityException {
        LOG.info("Starting passive location listener");
        if (passiveLocationListener == null) {
            passiveLocationListener = new GeneralLocationListener(this, "PASSIVE");
        }
        locationManager.requestLocationUpdates(LocationManager.PASSIVE_PROVIDER, 1000, 0, passiveLocationListener);
        locationManager.addGpsStatusListener(passiveLocationListener);
    }

    private void stopPassiveManager() throws SecurityException {
        LOG.debug("Removing locationManager updates");
        locationManager.removeUpdates(passiveLocationListener);
        locationManager.removeGpsStatusListener(passiveLocationListener);
    }

    /**
     * Request location updates from CELL or GPS
     *
     * We always listen for passive location updates, but periodically we will initiate location updates
     */
    private void requestLocationUpdate() throws SecurityException {
        if (requestingLocationUpdate) {
            // do nothing
            LOG.info("Location update already been requested ...");
            return;
        }

        if(!checkTowerAndGpsStatus()) {
            LOG.info("No Location service found!");
            setLocationServiceUnavailable();
            setAlarmForNextPoint();
            return;
        }

        //If the user has been still for more than the minimum seconds
        if (userHasBeenStillForTooLong()) {
            LOG.info("No movement detected in the past interval, will not log");
            setAlarmForNextPoint();
            return;
        }

        cellLocation = null;

        Session.setStatus("Start requesting location update ...");

        // clear last received cell location
        if(Session.isGpsEnabled()) {
            LOG.info("Requesting GPS location update ...");
            Session.setUsingGps(true);
            if (gpsLocationListener == null) {
                gpsLocationListener = new GeneralLocationListener(this, "GPS");
            }

            // gps satellite based
            locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 1000, 0, gpsLocationListener);
            locationManager.addGpsStatusListener(gpsLocationListener);
            locationManager.addNmeaListener(gpsLocationListener);
        }
        else {
            Session.setUsingGps(false);
        }

        LOG.info("Requesting CELL location update ...");
        if (towerLocationListener == null) {
            towerLocationListener = new GeneralLocationListener(this, "CELL");
        }

        locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 1000, 0, towerLocationListener);
        locationManager.addGpsStatusListener(towerLocationListener);

        /**
         * Start a timer so we know the location updates has been finished or failed ...
         */
        int timeout = preferenceHelper.getAbsoluteTimeoutForAcquiringPosition();
        if(timeout <= 0) {
            timeout = 5;
        }
        else if(timeout >= 10) {
            timeout = 10;
        }

        LOG.debug("Start timeout timer of " + timeout + " seconds");

        handler.postDelayed(timeoutLocationUpdateRunnable, timeout * 1000);

        EventBus.getDefault().post(new ServiceEvents.WaitingForLocation(true));
        Session.setWaitingForLocation(true);

        requestingLocationUpdate = true;
    }

    /**
     * Stops the location updates we have initiated
     */
    private void stopLocationUpdate() throws SecurityException {
        if (!requestingLocationUpdate) {
            LOG.info("No location update in progress");
            return;
        }

        if (towerLocationListener != null) {
            LOG.debug("Removing CELL updates listener");
            locationManager.removeUpdates(towerLocationListener);
            locationManager.removeGpsStatusListener(towerLocationListener);
            towerLocationListener = null;
        }

        if (gpsLocationListener != null) {
            LOG.debug("Removing GPS updates listener");
            locationManager.removeUpdates(gpsLocationListener);
            locationManager.removeGpsStatusListener(gpsLocationListener);
            gpsLocationListener = null;
        }

        Session.setWaitingForLocation(false);
        EventBus.getDefault().post(new ServiceEvents.WaitingForLocation(false));

        cellLocation = null;
        requestingLocationUpdate = false;
    }

    private boolean userHasBeenStillForTooLong() {
        return !Session.hasDescription() && !Session.isSinglePointMode() &&
                (Session.getUserStillSinceTimeStamp() > 0 && (System.currentTimeMillis() - Session.getUserStillSinceTimeStamp()) >
                        (preferenceHelper.getMinimumLoggingInterval() * 1000));
    }

    private Runnable timeoutLocationUpdateRunnable = new Runnable() {
        @Override
        public void run() {
            if(cellLocation == null) {
                Session.setStatus("Failed last location update");
                LOG.warn("Absolute timeout reached. Giving current location update request");
            }
            else {
                LOG.info("Absolute timeout reached. Use CELL location update - " + cellLocation);
                Session.setStatus("Logging CELL location update");
            }

            finishLocationUpdate(cellLocation);
        }
    };

    /**
     * Check if user has enabled / disabled the location services.
     *
     * Return true if any of the location service has been enabled, false otherwise
     */
    private boolean checkTowerAndGpsStatus() {
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
     * Stops location manager, then starts it.
     */
    void restartGpsManagers() {
        LOG.debug("Restarting location managers");
        stopLocationUpdate();
        requestLocationUpdate();
    }

    /**
     * This event is raised when the GeneralLocationListener has a new location. This method in turn updates notification, writes to file, reobtains
     * preferences, notifies main service client and resets location managers.
     *
     * If this is a passive location, we simply record it (unless we are requesting updates)
     * otherwise, we need to favor the location updates in following order: GPS location > Cell location > Passive Location
     * @param loc
     *         Location object
     */
    void onLocationChanged(Location loc) {
        Bundle b = loc.getExtras();
        if (b == null) {
            // Not a location we expected
            LOG.debug("Encounter invalid location update - " + loc);
            return;
        }

        if (!requestingLocationUpdate) {
            if (b.getBoolean("PASSIVE")) {
                LOG.debug("Receive passive location update - " + loc);
                // this is a valid location, let's save it
                Session.setStatus("Logging passive location update");
                finishLocationUpdate(loc);
            }
            else {
                // this is not a passive location update, we shall forgot it
                LOG.debug("Ignore non-passive location update - " + loc);
            }

            return;
        }

        if ("GPS".equalsIgnoreCase(b.getString("LISTENER"))) {
            // this is the GPS location update, save it directly
            LOG.debug(String.format("Receive GPS location change update: %s", loc));
            Session.setStatus("Logging GPS location update");
            finishLocationUpdate(loc);
        }
        else if("CELL".equalsIgnoreCase(b.getString("LISTENER"))) {
            // this is a CELL information, let's save it till timer expire
            LOG.debug(String.format("Receive CELL location change update: %s", loc));
            cellLocation = loc;
            Session.setStatus("Receive CELL location update");
            try {
                locationManager.removeUpdates(towerLocationListener);
                locationManager.removeGpsStatusListener(towerLocationListener);
                towerLocationListener = null;
            }
            catch(SecurityException se) {
                // ignore
            }
        }
        else {
            LOG.debug(String.format("Receive unknown location change update: %s", loc));
        }
    }

    void finishLocationUpdate(Location loc) {
        if(loc != null) {
            LOG.info(SessionLogcatAppender.MARKER_LOCATION, String.valueOf(loc.getLatitude()) + "," + String.valueOf(loc.getLongitude()));
            if (loc.hasAltitude()) {
                adjustAltitude(loc);
            }

            /**
             * We may have request both GPS and CELL location, so if GPS is enabled, we shall favor GPS location
             */
            Session.setLatestTimeStamp(System.currentTimeMillis());
            Session.setCurrentLocationInfo(loc);
            setDistanceTraveled(loc);
            showNotification();

            EventBus.getDefault().post(new ServiceEvents.LocationUpdate(loc));
            periodicTaskReceiver.collectLocationSample(this);
        }

        /**
         * Finish the location update by stop timer and start alarm for next request
         */
        if(requestingLocationUpdate) {
            handler.removeCallbacks(timeoutLocationUpdateRunnable);
            cellLocation = null;

            stopLocationUpdate();
            setAlarmForNextPoint();

            requestingLocationUpdate = false;
        }
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

        // Calculate this location and the previous location location and add to the current running total distance.
        // NOTE: Should be used in conjunction with 'distance required before logging' for more realistic values.
        double distance = Maths.calculateDistance(Session.getPreviousLatitude(), Session.getPreviousLongitude(), loc.getLatitude(), loc
                .getLongitude());
        Session.setPreviousLocationInfo(loc);
        Session.setTotalTravelled(Session.getTotalTravelled() + distance);
    }


    private void cancelAlarmForNextPoint() {
        Intent i = new Intent(this, GpsLoggingService.class);
        i.putExtra(IntentConstants.GET_NEXT_POINT, true);
        PendingIntent pi = PendingIntent.getService(this, 0, i, 0);
        nextPointAlarmManager.cancel(pi);
    }

    @TargetApi(23)
    private void setAlarmForNextPoint() {
        LOG.debug("Set alarm for " + preferenceHelper.getMinimumLoggingInterval() + " seconds");

        Intent i = new Intent(this, GpsLoggingService.class);
        i.putExtra(IntentConstants.GET_NEXT_POINT, true);
        PendingIntent pi = PendingIntent.getService(this, 0, i, 0);
        nextPointAlarmManager.cancel(pi);

        if (Systems.isDozing(this)) {
            //Only invoked once per 15 minutes in doze mode
            LOG.info("Device is dozing, using infrequent alarm");
            nextPointAlarmManager.setAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, SystemClock.elapsedRealtime() + preferenceHelper
                    .getMinimumLoggingInterval() * 1000, pi);
        } else {
            nextPointAlarmManager.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, SystemClock.elapsedRealtime() + preferenceHelper
                    .getMinimumLoggingInterval() * 1000, pi);
        }
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

            if (Session.isStarted()) {
                requestLocationUpdate();
            }
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
                requestLocationUpdate();
                Session.setUserStillSinceTimeStamp(System.currentTimeMillis());
            }

        } else {
            LOG.debug(activityRecognitionEvent.result.getMostProbableActivity().toString());
            //Reset the still-since timestamp
            Session.setUserStillSinceTimeStamp(0);
            LOG.debug("Just exited still state, attempt to log");
            requestLocationUpdate();
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
}
