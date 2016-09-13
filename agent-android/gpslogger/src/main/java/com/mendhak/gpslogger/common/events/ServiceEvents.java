package com.mendhak.gpslogger.common.events;

import android.location.Location;
import com.google.android.gms.location.ActivityRecognitionResult;

public class ServiceEvents {


    /**
     * New location
     */
    public static class LocationUpdate {
        public Location location;
        public LocationUpdate(Location loc) {
            this.location = loc;
        }
    }

    /**
     * Number of visible satellites
     */
    public static class SatellitesVisible {
        public int satelliteCount;
        public SatellitesVisible(int count) {
            this.satelliteCount = count;
        }
    }

    /**
     * Whether the logging service is still waiting for a location fix
     */
    public static class WaitingForGPSLocation {
        public boolean waiting;
        public WaitingForGPSLocation(boolean waiting) {
            this.waiting = waiting;
        }
    }

    /**
     * Whether the logging service is still waiting for a location fix
     */
    public static class WaitingForNetworkLocation {
        public boolean waiting;
        public WaitingForNetworkLocation(boolean waiting) {
            this.waiting = waiting;
        }
    }


    /**
     * Indicates that GPS/Network location services have temporarily gone away
     */
    public static class LocationServicesUnavailable {
    }

    /**
     * Status of the user's annotation, whether it has been written or is pending
     */
    public static class AnnotationStatus {
        public boolean annotationWritten;
        public AnnotationStatus(boolean written){
            this.annotationWritten = written;
        }
    }

    /**
     * Whether GPS logging has started; raised after the start/stop button is pressed
     */
    public static class LoggingStatus {
        public boolean loggingStarted;
        public LoggingStatus(boolean loggingStarted) {
            this.loggingStarted = loggingStarted;
        }
    }

    /**
     * The file name has been set
     */
    public static class FileNamed {
        public String newFileName;
        public FileNamed(String newFileName) {
            this.newFileName = newFileName;
        }
    }

    public static class ActivityRecognitionEvent {
        public ActivityRecognitionResult result;
        public ActivityRecognitionEvent(ActivityRecognitionResult arr) {
            this.result = arr;
        }
    }
}
