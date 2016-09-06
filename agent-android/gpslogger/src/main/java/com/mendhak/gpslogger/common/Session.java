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

package com.mendhak.gpslogger.common;


import android.location.Location;

// public class Session extends Application {
public class Session {


    // ---------------------------------------------------
    // Session values - updated as the app runs
    // ---------------------------------------------------
    private static boolean towerEnabled;
    private static boolean gpsEnabled;
    private static boolean isStarted;
    private static boolean isUsingGps;
    private static String currentFileName;
    private static int satellites;
    private static boolean notificationVisible;
    private static float autoSendDelay;
    private static long startTimeStamp;
    private static long latestTimeStamp;
    private static boolean addNewTrackSegment = true;
    private static Location currentLocationInfo;
    private static Location previousLocationInfo;
    private static double totalTravelled;
    private static int numLegs;
    private static boolean isBound;
    private static String description = "";
    private static boolean isSinglePointMode = false;
    private static int retryTimeout = 0;
    private static boolean waitingForLocation;
    private static boolean annotationMarked;
    private static String currentFormattedFileName;
    private static long userStillSinceTimeStamp;

    private static String status;

    public static boolean isSinglePointMode() {
        return isSinglePointMode;
    }

    public static void setSinglePointMode(boolean singlePointMode) {
        isSinglePointMode = singlePointMode;
    }

    // ---------------------------------------------------

    /**
     * @return whether GPS (tower) is enabled
     */
    public static boolean isTowerEnabled() {
        return towerEnabled;
    }

    /**
     * @param towerEnabled set whether GPS (tower) is enabled
     */
    public static void setTowerEnabled(boolean towerEnabled) {
        Session.towerEnabled = towerEnabled;
    }

    /**
     * @return whether GPS (satellite) is enabled
     */
    public static boolean isGpsEnabled() {
        return gpsEnabled;
    }

    /**
     * @param gpsEnabled set whether GPS (satellite) is enabled
     */
    public static void setGpsEnabled(boolean gpsEnabled) {
        Session.gpsEnabled = gpsEnabled;
    }

    /**
     * @return whether logging has started
     */
    public static boolean isStarted() {
        return isStarted;
    }

    /**
     * @param isStarted set whether logging has started
     */
    public static void setStarted(boolean isStarted) {
        Session.isStarted = isStarted;
        if (isStarted) {
            Session.startTimeStamp = System.currentTimeMillis();
        }
    }

    /**
     * @return the isUsingGps
     */
    public static boolean isUsingGps() {
        return isUsingGps;
    }

    /**
     * @param isUsingGps the isUsingGps to set
     */
    public static void setUsingGps(boolean isUsingGps) {
        Session.isUsingGps = isUsingGps;
    }

    /**
     * @return the currentFileName (without extension)
     */
    public static String getCurrentFileName() {
        PreferenceHelper preferenceHelper = PreferenceHelper.getInstance();
        if (preferenceHelper.shouldCreateCustomFile() && !Strings.isNullOrEmpty(currentFileName)) {
            return Strings.getFormattedCustomFileName(currentFileName);
        } else {
            if (!Strings.isNullOrEmpty(currentFileName) && preferenceHelper.shouldPrefixSerialToFileName() && !currentFileName.contains(Strings.getBuildSerial())) {
                currentFileName = String.valueOf(Strings.getBuildSerial()) + "_" + currentFileName;
            }
        }
        return currentFileName;
    }


    /**
     * @param currentFileName the currentFileName to set
     */
    public static void setCurrentFileName(String currentFileName) {
        Session.currentFileName = currentFileName;
    }

    /**
     * @return the number of satellites visible
     */
    public static int getVisibleSatelliteCount() {
        return satellites;
    }

    /**
     * @param satellites sets the number of visible satellites
     */
    public static void setVisibleSatelliteCount(int satellites) {
        Session.satellites = satellites;
    }


    /**
     * @return the currentLatitude
     */
    public static double getCurrentLatitude() {
        if (getCurrentLocationInfo() != null) {
            return getCurrentLocationInfo().getLatitude();
        } else {
            return 0;
        }
    }

    public static double getPreviousLatitude() {
        Location loc = getPreviousLocationInfo();
        return loc != null ? loc.getLatitude() : 0;
    }

    public static double getPreviousLongitude() {
        Location loc = getPreviousLocationInfo();
        return loc != null ? loc.getLongitude() : 0;
    }

    public static double getTotalTravelled() {
        return totalTravelled;
    }

    public static int getNumLegs() {
        return numLegs;
    }

    public static void setTotalTravelled(double totalTravelled) {
        if (totalTravelled == 0) {
            Session.numLegs = 0;
        } else {
            Session.numLegs++;
        }
        Session.totalTravelled = totalTravelled;
    }

    public static Location getPreviousLocationInfo() {
        return previousLocationInfo;
    }

    public static void setPreviousLocationInfo(Location previousLocationInfo) {
        Session.previousLocationInfo = previousLocationInfo;
    }


    /**
     * Determines whether a valid location is available
     */
    public static boolean hasValidLocation() {
        return (getCurrentLocationInfo() != null && getCurrentLatitude() != 0 && getCurrentLongitude() != 0);
    }

    /**
     * @return the currentLongitude
     */
    public static double getCurrentLongitude() {
        if (getCurrentLocationInfo() != null) {
            return getCurrentLocationInfo().getLongitude();
        } else {
            return 0;
        }
    }

    /**
     * @return the latestTimeStamp (for location info)
     */
    public static long getLatestTimeStamp() {
        return latestTimeStamp;
    }

    /**
     * @return the timestamp when measuring was started
     */
    public static long getStartTimeStamp() {
        return startTimeStamp;
    }

    /**
     * @param latestTimeStamp the latestTimeStamp (for location info) to set
     */
    public static void setLatestTimeStamp(long latestTimeStamp) {
        Session.latestTimeStamp = latestTimeStamp;
    }

    /**
     * @return whether to create a new track segment
     */
    public static boolean shouldAddNewTrackSegment() {
        return addNewTrackSegment;
    }

    /**
     * @param addNewTrackSegment set whether to create a new track segment
     */
    public static void setAddNewTrackSegment(boolean addNewTrackSegment) {
        Session.addNewTrackSegment = addNewTrackSegment;
    }

    /**
     * @param autoSendDelay the autoSendDelay to set
     */
    public static void setAutoSendDelay(float autoSendDelay) {
        Session.autoSendDelay = autoSendDelay;
    }

    /**
     * @return the autoSendDelay to use for the timer
     */
    public static float getAutoSendDelay() {
        return autoSendDelay;
    }

    /**
     * @param currentLocationInfo the latest Location class
     */
    public static void setCurrentLocationInfo(Location currentLocationInfo) {
        Session.currentLocationInfo = currentLocationInfo;
    }

    /**
     * @return the Location class containing latest lat-long information
     */
    public static Location getCurrentLocationInfo() {
        return currentLocationInfo;
    }

    /**
     * @param isBound set whether the activity is bound to the GpsLoggingService
     */
    public static void setBoundToService(boolean isBound) {
        Session.isBound = isBound;
    }

    /**
     * @return whether the activity is bound to the GpsLoggingService
     */
    public static boolean isBoundToService() {
        return isBound;
    }

    public static boolean hasDescription() {
        return !(description.length() == 0);
    }

    public static String getDescription() {
        return description;
    }

    public static void clearDescription() {
        description = "";
    }

    public static void setDescription(String newDescription) {
        description = newDescription;
    }

    public static void setWaitingForLocation(boolean waitingForLocation) {
        Session.waitingForLocation = waitingForLocation;
    }

    public static boolean isWaitingForLocation() {
        return waitingForLocation;
    }

    public static boolean isAnnotationMarked() {
        return annotationMarked;
    }

    public static void setAnnotationMarked(boolean annotationMarked) {
        Session.annotationMarked = annotationMarked;
    }

    public static String getCurrentFormattedFileName() {
        return currentFormattedFileName;
    }

    public static void setCurrentFormattedFileName(String currentFormattedFileName) {
        Session.currentFormattedFileName = currentFormattedFileName;
    }

    public static long getUserStillSinceTimeStamp() {
        return userStillSinceTimeStamp;
    }

    public static void setUserStillSinceTimeStamp(long lastUserStillTimeStamp) {
        Session.userStillSinceTimeStamp = lastUserStillTimeStamp;
    }

    public static void setStatus(String s) {
        status = s;
    }

    public static String getStatus() {
        return status;
    }
}
