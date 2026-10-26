# C1 Transit / Open-Data Evidence



**Checked:** 2026-10-26



## Summary



No directly documented public GTFS or GTFS-Realtime/API feed endpoint was verified on the four requested public-sector sources during this check. The sources do expose transit information and/or indicate live-tracking capabilities, but that is not sufficient to claim a documented machine-readable feed for CityPulse. Therefore CityPulse should not scrape these sites as a feed.



## 1. Chennai Metro Rail Limited (CMRL)



- **Source:** CMRL official website: https://chennaimetrorail.org/

- **Finding:** The official site documents passenger-facing services including a Travel Planner and station information. A separate official Travel Planner is available at https://travelplanner.chennaimetrorail.org/. No public developer/API page or documented GTFS/GTFS-Realtime download endpoint was identified in the checked official pages.

- **Assessment:** Passenger-facing route/timetable information is documented, but a public machine-readable API/GTFS endpoint was **not verified** from the official CMRL source.



## 2. Metropolitan Transport Corporation (MTC Chennai)



- **Source:** MTC official website: https://mtcbus.tn.gov.in/

- **Finding:** The official site provides bus timing schedules, route information and, in its 20-May-2026 news item, states that Live Tracking services are available on the MTC website. The checked official pages do not document a public GTFS or GTFS-Realtime download/API endpoint.

- **Assessment:** Live tracking and schedule information are publicly exposed through the MTC website, but a documented public machine-readable API/GTFS-RT endpoint was **not verified** from the official MTC pages checked.



## 3. data.gov.in



- **Source:** https://www.data.gov.in/

- **Finding:** The requested Chennai transit check did not produce a verified official CMRL/MTC GTFS or GTFS-Realtime endpoint that can be cited as a current feed source.

- **Assessment:** No current Chennai transit feed endpoint was verified from data.gov.in during this check. Do not treat third-party GTFS mirrors as a data.gov.in feed.



## 4. Greater Chennai Corporation (GCC)



- **Source:** https://chennaicorporation.gov.in/

- **Finding:** No documented public CMRL/MTC GTFS or GTFS-Realtime/API endpoint was identified from the checked GCC public information pages.

- **Assessment:** No machine-readable transit feed was verified from GCC.



## Supporting external evidence



- A 2026 Chennai transit data project reports that CUMTA's Transit Data portal has published GTFS files for CMRL and Southern Railway, but this is **secondary evidence**, not an official CMRL/MTC/GCC developer document. The reported CMRL feed is described as historical/stale rather than live.

- Transitland currently lists an MTC GTFS feed, but its operator page warns that its associated feed data is old; this is also a third-party catalog, not an MTC-published developer endpoint.



## Conclusion for CityPulse



1. Do not scrape CMRL, MTC, data.gov.in or GCC web pages as if they were a documented transit feed.

2. No current official GTFS/GTFS-Realtime/API endpoint was verified from the four requested sources in this evidence check.

3. CMRL and MTC do provide passenger-facing route/schedule/live-tracking functionality, but that alone does not establish a documented public API or GTFS-RT feed.

4. Any future use of a transit feed should cite the exact publisher, feed URL, access date and format, and should be re-checked for freshness before integration.


