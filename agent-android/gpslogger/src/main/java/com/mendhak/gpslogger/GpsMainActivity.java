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

package com.mendhak.gpslogger;


import android.Manifest;
import android.annotation.TargetApi;
import android.app.FragmentTransaction;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.location.LocationManager;
import android.os.*;
import android.support.v4.widget.DrawerLayout;
import android.support.v7.app.ActionBarDrawerToggle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.*;
import android.widget.Toast;
import com.mendhak.gpslogger.common.EventBusHook;
import com.mendhak.gpslogger.common.PreferenceHelper;
import com.mendhak.gpslogger.common.Session;
import com.mendhak.gpslogger.common.events.UploadEvents;
import com.mendhak.gpslogger.common.slf4j.Logs;
import com.mendhak.gpslogger.common.slf4j.SessionLogcatAppender;
import com.mendhak.gpslogger.loggers.Files;
import com.mendhak.gpslogger.qr.CaptureActivity;
import com.mendhak.gpslogger.ui.Dialogs;
import com.mendhak.gpslogger.ui.components.GpsLoggerDrawerItem;
import com.mendhak.gpslogger.ui.fragments.display.GpsSimpleViewFragment;
import com.mikepenz.materialdrawer.Drawer;
import com.mikepenz.materialdrawer.DrawerBuilder;
import com.mikepenz.materialdrawer.model.DividerDrawerItem;
import com.mikepenz.materialdrawer.model.interfaces.IDrawerItem;
import de.greenrobot.event.EventBus;
import org.slf4j.Logger;

import java.io.File;
import java.util.*;

public class GpsMainActivity extends AppCompatActivity implements Toolbar.OnMenuItemClickListener {

    private static final int REQUEST_CODE_ASK_MULTIPLE_PERMISSIONS = 98;
    private static boolean userInvokedUpload;
    private static Intent serviceIntent;
    private ActionBarDrawerToggle drawerToggle;
    private static final Logger LOG = Logs.of(GpsMainActivity.class);

    Drawer materialDrawer;
    private PreferenceHelper preferenceHelper = PreferenceHelper.getInstance();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LOG.info("Creating Application");
        loadPresetProperties();
        loadVersionSpecificProperties();

        setContentView(R.layout.activity_gps_main);

        setUpToolbar();
        setUpNavigationDrawer(savedInstanceState);

        registerEventBus();

        reqPermissions();
    }

    @Override
    public void onSaveInstanceState(Bundle outState) {

        //Save the drawer's selected values to bundle
        //useful if activity recreated due to rotation
        outState = materialDrawer.saveInstanceState(outState);

        super.onSaveInstanceState(outState);
    }

    private void registerEventBus() {
        EventBus.getDefault().register(this);
    }

    private void unregisterEventBus() {
        try {
            EventBus.getDefault().unregister(this);
        } catch (Throwable t) {
            //this may crash if registration did not go through. just be safe
        }
    }

    @TargetApi(Build.VERSION_CODES.M)
    private void reqPermissions() {
        List<String> permissionsNeeded = new ArrayList();
        final List<String> permissionsList = new ArrayList();
        if (!addPermission(permissionsList, Manifest.permission.ACCESS_FINE_LOCATION)) permissionsNeeded.add("GPS");
        if (!addPermission(permissionsList, Manifest.permission.CAMERA)) permissionsNeeded.add("CAMERA");
        if (!addPermission(permissionsList, Manifest.permission.WRITE_EXTERNAL_STORAGE)) permissionsNeeded.add("Write STORAGE");

        if (permissionsList.size() > 0) {
            if (permissionsNeeded.size() > 0) {
                for (int i = 1; i < permissionsNeeded.size(); i++) {
                    requestPermissions(permissionsList.toArray(new String[permissionsList.size()]), REQUEST_CODE_ASK_MULTIPLE_PERMISSIONS);
                }
                return;
            }
            requestPermissions(permissionsList.toArray(new String[permissionsList.size()]), REQUEST_CODE_ASK_MULTIPLE_PERMISSIONS);
            return;
        }

        showMainPage();
    }

    private boolean addPermission(List<String> permissionsList, String permission) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (checkSelfPermission(permission) != PackageManager.PERMISSION_GRANTED) {
                permissionsList.add(permission);
                // Check for Rationale Option
                if (!shouldShowRequestPermissionRationale(permission)) return false;
            }
        }
        return true;
    }

    private void showMainPage() {
        loadDefaultFragmentView();
        startAndBindService();
    }

    @Override
    protected void onStart() {
        super.onStart();
        startAndBindService();
    }

    @Override
    protected void onResume() {
        super.onResume();
        startAndBindService();
    }

    @Override
    protected void onPause() {
        stopAndUnbindServiceIfRequired();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        stopAndUnbindServiceIfRequired();
        unregisterEventBus();
        super.onDestroy();

    }

    @Override
    protected void onPostCreate(Bundle savedInstanceState) {
        super.onPostCreate(savedInstanceState);
        drawerToggle.syncState();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        drawerToggle.onConfigurationChanged(newConfig);
    }


    public boolean onKeyUp(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_MENU) {
            toggleDrawer();
        }

        return super.onKeyUp(keyCode, event);
    }

    /**
     * Handles the hardware back-button press
     */
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && Session.isBoundToService()) {
            stopAndUnbindServiceIfRequired();
        }

        if (keyCode == KeyEvent.KEYCODE_BACK) {
            DrawerLayout drawerLayout = (DrawerLayout) findViewById(R.id.drawer_layout);
            if (drawerLayout.isDrawerOpen(Gravity.LEFT)) {
                toggleDrawer();
                return true;
            }
        }

        return super.onKeyDown(keyCode, event);
    }


    private void loadVersionSpecificProperties() {
        PackageInfo packageInfo;
        try {
            packageInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
            int versionCode = packageInfo.versionCode;

            if (preferenceHelper.getLastVersionSeen() <= 71) {
                LOG.debug("preferenceHelper.getLastVersionSeen() " + preferenceHelper.getLastVersionSeen());
                //Specifically disable passive provider... just once
                if (preferenceHelper.getChosenListeners().contains("passive")) {
                    Set<String> listeners = new HashSet<>();
                    if (preferenceHelper.getChosenListeners().contains(LocationManager.GPS_PROVIDER)) {
                        listeners.add(LocationManager.GPS_PROVIDER);
                    }
                    if (preferenceHelper.getChosenListeners().contains(LocationManager.NETWORK_PROVIDER)) {
                        listeners.add(LocationManager.NETWORK_PROVIDER);
                    }
                    preferenceHelper.setChosenListeners(listeners);
                }
            }
            preferenceHelper.setLastVersionSeen(versionCode);
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }

    }

    private void loadPresetProperties() {

        //Either look for /<appfolder>/gpslogger.properties or /sdcard/gpslogger.properties
        File file = new File(Files.storageFolder(getApplicationContext()) + "/gpslogger.properties");
        if (!file.exists()) {
            file = new File(Environment.getExternalStorageDirectory() + "/gpslogger.properties");
            if (!file.exists()) {
                return;
            }
        }

        try {
            preferenceHelper.setPreferenceFromPropertiesFile(file);
        } catch (Exception e) {
            LOG.error("Could not load preset properties", e);
        }
    }


    /**
     * Helper method, launches activity in a delayed handler, less stutter
     */
    private void launchPreferenceScreen(final String whichFragment) {
        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                Intent targetActivity = new Intent(getApplicationContext(), MainPreferenceActivity.class);
                targetActivity.putExtra("preference_fragment", whichFragment);
                startActivity(targetActivity);
            }
        }, 250);
    }


    public Toolbar getToolbar() {
        return (Toolbar) findViewById(R.id.toolbar);
    }

    public void setUpToolbar() {
        try {
            Toolbar toolbar = getToolbar();
            setSupportActionBar(toolbar);
            if (getSupportActionBar() != null) {
                getSupportActionBar().setDisplayShowTitleEnabled(false);
            }

            /*
            //Deprecated in Lollipop but required if targeting 4.x
            SpinnerAdapter spinnerAdapter = ArrayAdapter.createFromResource(getApplicationContext(), R.array.gps_main_views, R.layout
                    .spinner_dropdown_item);
            getSupportActionBar().setNavigationMode(ActionBar.NAVIGATION_MODE_LIST);
            getSupportActionBar().setListNavigationCallbacks(spinnerAdapter, this);
            getSupportActionBar().setSelectedNavigationItem(0);
            */

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                Window window = getWindow();
                window.addFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            }
        } catch (Exception ex) {
            //http://stackoverflow.com/questions/26657348/appcompat-v7-v21-0-0-causing-crash-on-samsung-devices-with-android-v4-2-2
            LOG.error("Thanks for this, Samsung", ex);
        }

    }

    public void setUpNavigationDrawer(Bundle savedInstanceState) {

        final DrawerLayout drawerLayout = (DrawerLayout) findViewById(R.id.drawer_layout);

        drawerToggle = new ActionBarDrawerToggle(this, drawerLayout, getToolbar(), R.string.navigation_drawer_open, R.string
                .navigation_drawer_close) {

            public void onDrawerClosed(View view) {
                invalidateOptionsMenu();
            }

            public void onDrawerOpened(View drawerView) {
                invalidateOptionsMenu();
            }
        };

        materialDrawer = new DrawerBuilder().withActivity(this).withSavedInstance(savedInstanceState).withToolbar(getToolbar())
                .withActionBarDrawerToggle(drawerToggle).withDrawerGravity(Gravity.LEFT).withSelectedItem(-1).build();


        materialDrawer.addItem(GpsLoggerDrawerItem.newPrimary(R.string.pref_general_title, R.string.pref_general_summary, R.drawable.settings, 1000));
        materialDrawer.addItem(GpsLoggerDrawerItem.newPrimary(R.string.pref_performance_title, R.string.pref_performance_summary, R.drawable
                .performance, 1001));
        materialDrawer.addItem(new DividerDrawerItem());
        materialDrawer.addItem(GpsLoggerDrawerItem.newPrimary(R.string.pref_connect_app_title, R.string.pref_connect_app_summary, R.drawable
                .qrcode, 1002));


        materialDrawer.setOnDrawerItemClickListener(new Drawer.OnDrawerItemClickListener() {
            @Override
            public boolean onItemClick(View view, int i, IDrawerItem iDrawerItem) {
                switch (iDrawerItem.getIdentifier()) {
                    case 1000:
                        launchPreferenceScreen(MainPreferenceActivity.PREFERENCE_FRAGMENTS.GENERAL);
                        break;
                    case 1001:
                        launchPreferenceScreen(MainPreferenceActivity.PREFERENCE_FRAGMENTS.PERFORMANCE);
                        break;
                    case 1002:
                        CaptureActivity.launch(GpsMainActivity.this);
                        break;
                }
                return false;
            }
        });
    }

    public void toggleDrawer() {
        if (materialDrawer.isDrawerOpen()) {
            materialDrawer.closeDrawer();

        } else {
            materialDrawer.openDrawer();
        }
    }

    private void loadDefaultFragmentView() {
        FragmentTransaction transaction = getFragmentManager().beginTransaction();
        // transaction.replace(R.id.container, GpsDetailedViewFragment.newInstance());
        transaction.replace(R.id.container, GpsSimpleViewFragment.newInstance());
        // transaction.replace(R.id.container, GpsBigViewFragment.newInstance());
        transaction.commitAllowingStateLoss();
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        return true;
    }

    @Override
    public boolean onMenuItemClick(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        int id = item.getItemId();

        LOG.debug("Menu Item: " + String.valueOf(item.getTitle()));

        switch (id) {
            default:
                return true;
        }
    }

    /**
     * Provides a connection to the GPS Logging Service
     */
    private final ServiceConnection gpsServiceConnection = new ServiceConnection() {

        public void onServiceDisconnected(ComponentName name) {
            LOG.debug("Disconnected from GPSLoggingService from MainActivity");
            //loggingService = null;
        }

        public void onServiceConnected(ComponentName name, IBinder service) {
            LOG.debug("Connected to GPSLoggingService from MainActivity");
            //loggingService = ((GpsLoggingService.GpsLoggingBinder) service).getService();
        }
    };


    /**
     * Starts the service and binds the activity to it.
     */
    private void startAndBindService() {
        LOG.info("Starting GPS Logging Service ...");
        serviceIntent = new Intent(this, GpsLoggingService.class);
        // Start the service in case it isn't already running
        startService(serviceIntent);
        // Now bind to service
        bindService(serviceIntent, gpsServiceConnection, Context.BIND_AUTO_CREATE);
        Session.setBoundToService(true);
    }


    /**
     * Stops the service if it isn't logging. Also unbinds.
     */
    private void stopAndUnbindServiceIfRequired() {
        if (Session.isBoundToService()) {

            try {
                unbindService(gpsServiceConnection);
                Session.setBoundToService(false);
            } catch (Exception e) {
                LOG.warn(SessionLogcatAppender.MARKER_INTERNAL, "Could not unbind service", e);
            }
        }

        /*
         * TODO: let's not stop the service ... keep it always running
        if (!Session.isStarted()) {
            LOG.debug("Stopping the service");
            try {
                stopService(serviceIntent);
            } catch (Exception e) {
                LOG.error("Could not stop the service", e);
            }
        }
        */
    }


    @EventBusHook
    public void onEventMainThread(UploadEvents.OpenGTS upload) {
        LOG.debug("Open GTS Event completed, success: " + upload.success);
        Dialogs.hideProgress();

        if (!upload.success) {
            LOG.error(getString(R.string.opengts_setup_title) + "-" + getString(R.string.upload_failure));

            if (userInvokedUpload) {
                Dialogs.error(getString(R.string.sorry), getString(R.string.upload_failure), upload.message, upload.throwable, this);
                userInvokedUpload = false;
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        switch (requestCode) {
            case REQUEST_CODE_ASK_MULTIPLE_PERMISSIONS: {
                Map<String, Integer> perms = new HashMap<String, Integer>();
                // Initial
                perms.put(Manifest.permission.ACCESS_FINE_LOCATION, PackageManager.PERMISSION_GRANTED);
                perms.put(Manifest.permission.CAMERA, PackageManager.PERMISSION_GRANTED);
                perms.put(Manifest.permission.WRITE_EXTERNAL_STORAGE, PackageManager.PERMISSION_GRANTED);
                // Fill with results
                for (int i = 0; i < permissions.length; i++)
                    perms.put(permissions[i], grantResults[i]);
                // Check for ACCESS_FINE_LOCATION
                if (perms.get(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED && perms.get(Manifest.permission
                        .CAMERA) == PackageManager.PERMISSION_GRANTED && perms.get(Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager
                        .PERMISSION_GRANTED) {
                    // All Permissions Granted
                    showMainPage();
                } else {
                    // Permission Denied
                    Toast.makeText(this, "Some Permission is Denied", Toast.LENGTH_SHORT).show();
                }
            }
            break;
            default:
                super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        }
    }

}
