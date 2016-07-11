/*
*    This file is part of GPSLogger for Android.
*
*    GPSLogger for Android is free software: you can redistribute it and/or modify
*    it under the terms of the GNU General Public License as published by
*    the Free Software Foundation, either version 3 of the License, or
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


package com.mendhak.gpslogger;

import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.widget.ExpandableListView;
import com.mendhak.gpslogger.common.slf4j.Logs;
import com.mendhak.gpslogger.ui.components.ExpandableListAdapter;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class Faqtivity extends AppCompatActivity {

    ExpandableListAdapter listAdapter;
    ExpandableListView expListView;
    List<String> listDataHeader;
    HashMap<String, List<String>> listDataChild;

    private static final Logger LOG = Logs.of(Faqtivity.class);
    /**
     * Event raised when the form is created for the first time
     */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        try{
            super.onCreate(savedInstanceState);
            setContentView(R.layout.activity_faq);
            Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
            setSupportActionBar(toolbar);
            if(getSupportActionBar() != null){
                getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            }


        }
        catch(Exception ex){
            //http://stackoverflow.com/questions/26657348/appcompat-v7-v21-0-0-causing-crash-on-samsung-devices-with-android-v4-2-2
            LOG.error("Thanks for this, Samsung", ex);
        }

        expListView = (ExpandableListView) findViewById(R.id.lvExp);

        expListView.setOnGroupExpandListener(new ExpandableListView.OnGroupExpandListener() {
            int previousGroup = -1;

            @Override
            public void onGroupExpand(int groupPosition) {
                if (groupPosition != previousGroup)
                    expListView.collapseGroup(previousGroup);
                previousGroup = groupPosition;

            }
        });

        // preparing list data
        prepareHelpTopics();

        listAdapter = new ExpandableListAdapter(this, listDataHeader, listDataChild);

        // setting list adapter
        expListView.setAdapter(listAdapter);
        expListView.expandGroup(0);
    }

    private void prepareHelpTopics() {
        listDataHeader = new ArrayList<>();
        listDataChild = new HashMap<>();

        listDataHeader.add(getString(R.string.faq_generalsection));
        listDataHeader.add(getString(R.string.faq_preferencesandfilters));
        listDataHeader.add(getString(R.string.faq_advancedsection));

        List<String> generalTopics = new ArrayList<>();
        generalTopics.add(getString(R.string.faq_topic_whyisntitaccurate));
        generalTopics.add(getString(R.string.faq_topic_howtoremovenotification));
        generalTopics.add(getString(R.string.faq_topic_profiles));
        generalTopics.add(getString(R.string.faq_topic_usemylocaltimezone));
        generalTopics.add(getString(R.string.faq_topic_imperial));
        generalTopics.add(getString(R.string.faq_topic_whydoesfixtakelongtime));


        List<String> preferencesAndFiltersTopics = new ArrayList<>();
        preferencesAndFiltersTopics.add(getString(R.string.faq_topic_whatvariousfiltersmean));
        preferencesAndFiltersTopics.add(getString(R.string.faq_topic_whereisthefilelogged));
        preferencesAndFiltersTopics.add(getString(R.string.faq_topic_howtogetthefile));
        preferencesAndFiltersTopics.add(getString(R.string.faq_topic_loadingpresets));


        List<String> advancedTopics = new ArrayList<>();
        advancedTopics.add(getString(R.string.faq_topic_thirdpartyintegration));
        advancedTopics.add(getString(R.string.faq_topic_taskerintegration));
        advancedTopics.add(getString(R.string.faq_topic_howgpsworks));


        listDataChild.put(listDataHeader.get(0), generalTopics);
        listDataChild.put(listDataHeader.get(1), preferencesAndFiltersTopics);
        listDataChild.put(listDataHeader.get(2), advancedTopics);
    }

    @Override
    protected void onDestroy() {
        setVisible(false);
        super.onDestroy();
    }

    @Override
    public void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        setVisible(false);
    }

    @Override
    protected void onStop() {
        super.onStop();
    }
}
