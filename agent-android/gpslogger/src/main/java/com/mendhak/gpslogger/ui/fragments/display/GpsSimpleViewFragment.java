/*******************************************************************************
 * This file is part of GPSLogger for Android.
 *
 * GPSLogger for Android is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or (at your option) any later version.
 *
 * GPSLogger for Android is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with GPSLogger for Android.  If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/

package com.mendhak.gpslogger.ui.fragments.display;

import android.Manifest;
import android.content.Context;
import android.graphics.Color;
import android.location.Location;
import android.location.LocationManager;
import android.os.Bundle;
import android.support.v4.content.ContextCompat;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.AlphaAnimation;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;
import com.canelmas.let.AskPermission;
import com.dd.processbutton.iml.ActionProcessButton;
import com.mendhak.gpslogger.R;
import com.mendhak.gpslogger.common.EventBusHook;
import com.mendhak.gpslogger.common.PreferenceHelper;
import com.mendhak.gpslogger.common.Session;
import com.mendhak.gpslogger.common.Strings;
import com.mendhak.gpslogger.common.events.ServiceEvents;
import com.mendhak.gpslogger.common.slf4j.Logs;
import com.mendhak.gpslogger.qr.CaptureActivity;
import org.slf4j.Logger;

import java.text.NumberFormat;

public class GpsSimpleViewFragment extends GenericViewFragment implements View.OnClickListener {

    Context context;
    private static final Logger LOG = Logs.of(GpsSimpleViewFragment.class);
    private PreferenceHelper preferenceHelper = PreferenceHelper.getInstance();

    private View rootView;
    private ActionProcessButton actionButton;

    public GpsSimpleViewFragment() {

    }

    public static GpsSimpleViewFragment newInstance() {

        GpsSimpleViewFragment fragment = new GpsSimpleViewFragment();
        Bundle bundle = new Bundle(1);
        bundle.putInt("a_number", 1);

        fragment.setArguments(bundle);
        return fragment;


    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {

        rootView = inflater.inflate(R.layout.fragment_simple_view, container, false);


        if (getActivity() != null) {
            this.context = getActivity().getApplicationContext();

        }

        setImageTooltips();

        actionButton = (ActionProcessButton) rootView.findViewById(R.id.btnActionProcess);
        actionButton.setMode(ActionProcessButton.Mode.ENDLESS);
        actionButton.setBackgroundColor(ContextCompat.getColor(context, (R.color.accentColor)));

        actionButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                requestToggleLogging();
            }
        });


        if (Session.hasValidLocation()) {
            displayLocationInfo(Session.getCurrentLocationInfo());
        }


        return rootView;
    }

    private void setActionButtonStart() {
        actionButton.setText(R.string.btn_start_logging);
        actionButton.setBackgroundColor(ContextCompat.getColor(context, R.color.accentColor));
        actionButton.setAlpha(0.8f);
    }

    private void setActionButtonStop() {
        actionButton.setText(R.string.btn_stop_logging);
        actionButton.setBackgroundColor(ContextCompat.getColor(context, R.color.accentColorComplementary));
        actionButton.setAlpha(0.8f);
    }

    private enum IconColorIndicator {
        Good,
        Warning,
        Bad,
        Inactive
    }

    private void clearColor(ImageView imgView) {
        setColor(imgView, IconColorIndicator.Inactive);
    }

    private void setColor(ImageView imgView, IconColorIndicator colorIndicator) {
        imgView.clearColorFilter();

        if (colorIndicator == IconColorIndicator.Inactive) {
            return;
        }

        int color = -1;
        switch (colorIndicator) {
            case Bad:
                color = Color.parseColor("#FFEEEE");
                break;
            case Good:
                color = ContextCompat.getColor(context, R.color.accentColor);
                break;
            case Warning:
                color = Color.parseColor("#D4FFA300");
                break;
        }

        imgView.setColorFilter(color);

    }

    private void setImageTooltips() {
        ImageView imgSatellites = (ImageView) rootView.findViewById(R.id.simpleview_imgSatelliteCount);
        imgSatellites.setOnClickListener(this);

        ImageView imgAccuracy = (ImageView) rootView.findViewById(R.id.simpleview_imgAccuracy);
        imgAccuracy.setOnClickListener(this);

        ImageView imgElevation = (ImageView) rootView.findViewById(R.id.simpleview_imgAltitude);
        imgElevation.setOnClickListener(this);

        ImageView imgBearing = (ImageView) rootView.findViewById(R.id.simpleview_imgDirection);
        imgBearing.setOnClickListener(this);

        ImageView imgDuration = (ImageView) rootView.findViewById(R.id.simpleview_imgDuration);
        imgDuration.setOnClickListener(this);

        ImageView imgSpeed = (ImageView) rootView.findViewById(R.id.simpleview_imgSpeed);
        imgSpeed.setOnClickListener(this);

        ImageView imgDistance = (ImageView) rootView.findViewById(R.id.simpleview_distance);
        imgDistance.setOnClickListener(this);

        ImageView imgPoints = (ImageView) rootView.findViewById(R.id.simpleview_points);
        imgPoints.setOnClickListener(this);

        ImageView imgQR = (ImageView) rootView.findViewById(R.id.qr_scan);
        imgQR.setOnClickListener(this);

    }

    @Override
    public void onStart() {

        setActionButtonStop();
        super.onStart();
    }

    @Override
    public void onResume() {
        if (Session.isStarted()) {
            setActionButtonStop();
        } else {
            setActionButtonStart();
        }
        super.onResume();
    }

    @Override
    public void onPause() {

        super.onPause();
    }


    @EventBusHook
    public void onEventMainThread(ServiceEvents.LocationUpdate locationUpdate) {
        displayLocationInfo(locationUpdate.location);
    }

    @EventBusHook
    public void onEventMainThread(ServiceEvents.SatellitesVisible satellitesVisible) {
        setSatelliteCount(satellitesVisible.satelliteCount);
    }

    @EventBusHook
    public void onEventMainThread(ServiceEvents.WaitingForLocation waitingForLocation) {
        onWaitingForLocation(waitingForLocation.waiting);
    }

    @EventBusHook
    public void onEventMainThread(ServiceEvents.LoggingStatus loggingStatus) {

        if (loggingStatus.loggingStarted) {
            clearLocationDisplay();
            setActionButtonStop();
        } else {
            setSatelliteCount(-1);
            setActionButtonStart();
        }
    }

    public void displayLocationInfo(Location locationInfo) {
        NumberFormat nf = NumberFormat.getInstance();
        nf.setMaximumFractionDigits(3);

        EditText txtLatitude = (EditText) rootView.findViewById(R.id.simple_lat_text);
        txtLatitude.setText(String.valueOf(nf.format(locationInfo.getLatitude())) + ", " + String.valueOf(nf.format(locationInfo.getLongitude())));


        nf.setMaximumFractionDigits(3);


        ImageView imgAccuracy = (ImageView) rootView.findViewById(R.id.simpleview_imgAccuracy);
        clearColor(imgAccuracy);

        if (locationInfo.hasAccuracy()) {

            TextView txtAccuracy = (TextView) rootView.findViewById(R.id.simpleview_txtAccuracy);
            float accuracy = locationInfo.getAccuracy();
            txtAccuracy.setText(Strings.getDistanceDisplay(getActivity(), accuracy, preferenceHelper.shouldDisplayImperialUnits()));

            if (accuracy > 500) {
                setColor(imgAccuracy, IconColorIndicator.Warning);
            }

            if (accuracy > 900) {
                setColor(imgAccuracy, IconColorIndicator.Bad);
            } else {
                setColor(imgAccuracy, IconColorIndicator.Good);
            }
        }

        ImageView imgAltitude = (ImageView) rootView.findViewById(R.id.simpleview_imgAltitude);
        clearColor(imgAltitude);

        if (locationInfo.hasAltitude()) {
            setColor(imgAltitude, IconColorIndicator.Good);
            TextView txtAltitude = (TextView) rootView.findViewById(R.id.simpleview_txtAltitude);

            txtAltitude.setText(Strings.getDistanceDisplay(getActivity(), locationInfo.getAltitude(), preferenceHelper.shouldDisplayImperialUnits()));
        }

        ImageView imgSpeed = (ImageView) rootView.findViewById(R.id.simpleview_imgSpeed);
        clearColor(imgSpeed);

        if (locationInfo.hasSpeed()) {

            setColor(imgSpeed, IconColorIndicator.Good);

            TextView txtSpeed = (TextView) rootView.findViewById(R.id.simpleview_txtSpeed);
            txtSpeed.setText(Strings.getSpeedDisplay(getActivity(), locationInfo.getSpeed(), preferenceHelper.shouldDisplayImperialUnits()));
        }

        ImageView imgDirection = (ImageView) rootView.findViewById(R.id.simpleview_imgDirection);
        clearColor(imgDirection);

        if (locationInfo.hasBearing()) {
            setColor(imgDirection, IconColorIndicator.Good);
            imgDirection.setRotation(locationInfo.getBearing());

            TextView txtDirection = (TextView) rootView.findViewById(R.id.simpleview_txtDirection);
            txtDirection.setText(String.valueOf(Math.round(locationInfo.getBearing())) + getString(R.string.degree_symbol));
        }

        TextView txtDuration = (TextView) rootView.findViewById(R.id.simpleview_txtDuration);

        long startTime = Session.getStartTimeStamp();
        long currentTime = System.currentTimeMillis();

        txtDuration.setText(Strings.getTimeDisplay(getActivity(), currentTime - startTime));

        double distanceValue = Session.getTotalTravelled();

        TextView txtPoints = (TextView) rootView.findViewById(R.id.simpleview_txtPoints);
        TextView txtTravelled = (TextView) rootView.findViewById(R.id.simpleview_txtDistance);

        txtTravelled.setText(Strings.getDistanceDisplay(getActivity(), distanceValue, preferenceHelper.shouldDisplayImperialUnits()));
        txtPoints.setText(Session.getNumLegs() + " " + getString(R.string.points));

        String providerName = locationInfo.getProvider();
        if (!providerName.equalsIgnoreCase(LocationManager.GPS_PROVIDER)) {
            setSatelliteCount(-1);
        }
    }


    private void clearLocationDisplay() {

        EditText txtLatitude = (EditText) rootView.findViewById(R.id.simple_lat_text);
        txtLatitude.setText("");

        ImageView imgAccuracy = (ImageView) rootView.findViewById(R.id.simpleview_imgAccuracy);
        clearColor(imgAccuracy);

        TextView txtAccuracy = (TextView) rootView.findViewById(R.id.simpleview_txtAccuracy);
        txtAccuracy.setText("");
        txtAccuracy.setTextColor(ContextCompat.getColor(context, android.R.color.black));

        ImageView imgAltitude = (ImageView) rootView.findViewById(R.id.simpleview_imgAltitude);
        clearColor(imgAltitude);

        TextView txtAltitude = (TextView) rootView.findViewById(R.id.simpleview_txtAltitude);
        txtAltitude.setText("");

        ImageView imgDirection = (ImageView) rootView.findViewById(R.id.simpleview_imgDirection);
        clearColor(imgDirection);

        TextView txtDirection = (TextView) rootView.findViewById(R.id.simpleview_txtDirection);
        txtDirection.setText("");

        ImageView imgSpeed = (ImageView) rootView.findViewById(R.id.simpleview_imgSpeed);
        clearColor(imgSpeed);

        TextView txtSpeed = (TextView) rootView.findViewById(R.id.simpleview_txtSpeed);
        txtSpeed.setText("");


        TextView txtDuration = (TextView) rootView.findViewById(R.id.simpleview_txtDuration);
        txtDuration.setText("");

        TextView txtPoints = (TextView) rootView.findViewById(R.id.simpleview_txtPoints);
        TextView txtTravelled = (TextView) rootView.findViewById(R.id.simpleview_txtDistance);

        txtPoints.setText("");
        txtTravelled.setText("");
    }


    public void setSatelliteCount(int count) {
        ImageView imgSatelliteCount = (ImageView) rootView.findViewById(R.id.simpleview_imgSatelliteCount);
        TextView txtSatelliteCount = (TextView) rootView.findViewById(R.id.simpleview_txtSatelliteCount);

        if (count > -1) {
            setColor(imgSatelliteCount, IconColorIndicator.Good);

            AlphaAnimation fadeIn = new AlphaAnimation(0.6f, 1.0f);
            fadeIn.setDuration(1200);
            fadeIn.setFillAfter(true);
            txtSatelliteCount.startAnimation(fadeIn);
            txtSatelliteCount.setText(String.valueOf(count));
        } else {
            clearColor(imgSatelliteCount);
            txtSatelliteCount.setText("");
        }

    }

    public void onWaitingForLocation(boolean inProgress) {

        LOG.debug(inProgress + "");

        if (!Session.isStarted()) {
            actionButton.setProgress(0);
            setActionButtonStart();
            return;
        }

        if (inProgress) {
            actionButton.setProgress(1);
            setActionButtonStop();
        } else {
            actionButton.setProgress(0);
            setActionButtonStop();
        }
    }


    @Override
    public void onClick(View view) {
        Toast toast = new Toast(getActivity());
        switch (view.getId()) {
            case R.id.simpleview_imgSatelliteCount:
                toast = getToast(R.string.txt_satellites);
                break;
            case R.id.simpleview_imgAccuracy:
                toast = getToast(R.string.txt_accuracy);
                break;

            case R.id.simpleview_imgAltitude:
                toast = getToast(R.string.txt_altitude);
                break;

            case R.id.simpleview_imgDirection:
                toast = getToast(R.string.txt_direction);
                break;

            case R.id.simpleview_imgDuration:
                toast = getToast(R.string.txt_travel_duration);
                break;

            case R.id.simpleview_imgSpeed:
                toast = getToast(R.string.txt_speed);
                break;

            case R.id.simpleview_distance:
                toast = getToast(R.string.txt_travel_distance);
                break;

            case R.id.simpleview_points:
                toast = getToast(R.string.txt_number_of_points);
                break;

            case R.id.qr_scan:
                toCaptureActivity();
                return;

        }

        int location[] = new int[2];
        view.getLocationOnScreen(location);
        toast.setGravity(Gravity.TOP | Gravity.LEFT, location[0], location[1]);
        toast.show();
    }

    @AskPermission({Manifest.permission.CAMERA, Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION, Manifest
            .permission.WRITE_EXTERNAL_STORAGE})
    private void toCaptureActivity() {
        CaptureActivity.launch(getActivity());
    }

    private Toast getToast(String message) {
        return Toast.makeText(getActivity(), message, Toast.LENGTH_SHORT);
    }

    private Toast getToast(int stringResourceId) {
        return getToast(getString(stringResourceId).replace(":", ""));
    }
}
