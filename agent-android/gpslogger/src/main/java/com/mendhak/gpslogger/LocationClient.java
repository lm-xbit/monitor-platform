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

import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.location.LocationProvider;
import android.os.Bundle;
import com.mendhak.gpslogger.common.Session;
import com.mendhak.gpslogger.common.slf4j.Logs;
import org.slf4j.Logger;

/**
 * A location client request data from given location provider on given interval
 * Once it received a value it will be saved to GpsLoggingService for further processing
 *
 * The provider could be a passive provider, a network provider or a GPS provider
 */
class LocationClient implements LocationListener {
    private static final Logger LOG = Logs.of(LocationClient.class);

    //
    // Name of provider
    private final String provider;

    //
    // interval in milliseconds to receive the update
    private final int interval;

    //
    // distance in meters to receive update
    private final int distance;

    //
    // logging service
    private final GpsLoggingService loggingService;


    //
    // We have only one location manager
    private final LocationManager locationManager;

    // If we have tried to request location update from GPS or CELL provider
    private boolean requestingLocationUpdate = false;

    public LocationClient(String provider, int interval, int distance, LocationManager locationManager, GpsLoggingService loggingService) {
        this.provider = provider;
        this.interval = interval;
        this.distance = distance;
        this.locationManager = locationManager;
        this.loggingService = loggingService;
    }

    public String getProvider() {
        return this.provider;
    }

    public void start() throws SecurityException {
        if(!requestingLocationUpdate) {
            requestLocationUpdate();
            requestingLocationUpdate = true;
        }
    }

    public void stop() {
        if(requestingLocationUpdate) {
            stopLocationUpdate();
            requestingLocationUpdate = false;
        }
    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {
        if(status != LocationProvider.AVAILABLE) {
            LOG.info("Location provider " + this.provider + " (" + provider + ") is available");
        }
        else {
            LOG.warn("Location provider " + this.provider + " (" + provider + ") is not available: " + status);
        }

        loggingService.onStatusChanged(this, status, extras);
    }

    @Override
    public void onProviderEnabled(String provider) {
        LOG.info("Location provider " + this.provider + " (" + provider + ") is enabled");
        loggingService.onProviderEnabled(this);
    }

    @Override
    public void onProviderDisabled(String provider) {
        LOG.warn("Location provider " + this.provider + " (" + provider + ") is disabled");
        loggingService.onProviderDisabled(this);
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
    @Override
    public void onLocationChanged(Location loc) {
        loggingService.onLocationChanged(this, loc);
    }

    /**
     * Request location updates from CELL or GPS
     *
     * We always listen for passive location updates, but periodically we will initiate location updates
     */
    private void requestLocationUpdate() throws SecurityException {
        if (requestingLocationUpdate) {
            // do nothing
            LOG.info("Location update already been requested for " + provider);
            return;
        }

        Session.setStatus("Start requesting location update for " + provider);

        // gps satellite based
        locationManager.requestLocationUpdates(provider, interval, distance, this);

        Location currentLocation = locationManager.getLastKnownLocation(provider);

        LOG.info("Get last known location for provider " + provider + ": " + currentLocation);
        if(currentLocation != null) {
            // update the first location here
            loggingService.onLocationChanged(this, currentLocation);
        }

        LOG.debug("Start timeout timer for GPS of " + interval + " milli seconds");

        requestingLocationUpdate = true;
    }

    /**
     * Stops the location updates we have initiated
     */
    private void stopLocationUpdate() throws SecurityException {
        if (!requestingLocationUpdate) {
            LOG.info("No GPS location update in progress for " + provider);
            return;
        }

        LOG.debug("Removing location update listener for " + provider);
        locationManager.removeUpdates(this);

        requestingLocationUpdate = false;
    }
}
