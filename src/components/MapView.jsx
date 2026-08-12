import { useEffect, useMemo, useState } from "react";
import { compareFirstName, nameFor } from "../lib/util.js";
import { SCHEDULE_SEGMENTS } from "../lib/scheduler.js";

const ZONES = [
  { key: "zone1", label: "Zone 1", className: "map-zone-1" },
  { key: "zone2", label: "Zone 2", className: "map-zone-2" },
  { key: "zone3", label: "Zone 3", className: "map-zone-3" },
];

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const numberedMatch = (kind, number) => (name) => {
  const n = normalize(name);
  const num = String(number);
  const padded = String(number).padStart(2, "0");

  if (kind === "station") {
    return new RegExp(`\\bstation\\s*(?:${num}|${padded})\\b`).test(n);
  }
  if (kind === "sub") {
    return (
      new RegExp(`\\bsub\\s*(?:${num}|${padded})\\b`).test(n) ||
      new RegExp(`\\bsub\\s*(?:assembly|line|station)\\s*(?:${num}|${padded})\\b`).test(n)
    );
  }
  if (kind === "pm") {
    return (
      new RegExp(`\\bpm\\s*(?:${num}|${padded})\\b`).test(n) ||
      new RegExp(`\\bparts?\\s*management\\s*(?:${num}|${padded})\\b`).test(n)
    );
  }
  return false;
};

const SLOT_DEFS = {
  pm3: { id: "pm3", label: "PM 3", zone: "zone1", matches: numberedMatch("pm", 3) },
  pm2: { id: "pm2", label: "PM 2", zone: "zone1", matches: numberedMatch("pm", 2) },
  pm1: { id: "pm1", label: "PM 1", zone: "zone2", matches: numberedMatch("pm", 1) },
  sub4: { id: "sub4", label: "Sub 4", zone: "zone3", matches: numberedMatch("sub", 4) },
  sub3: { id: "sub3", label: "Sub 3", zone: "zone3", matches: numberedMatch("sub", 3) },
  sub2: { id: "sub2", label: "Sub 2", zone: "zone3", matches: numberedMatch("sub", 2) },
  sub1: { id: "sub1", label: "Sub 1", zone: "zone3", matches: numberedMatch("sub", 1) },
  station1: { id: "station1", label: "Station 1", zone: "zone1", matches: numberedMatch("station", 1) },
  station2: { id: "station2", label: "Station 2", zone: "zone1", matches: numberedMatch("station", 2) },
  station3: { id: "station3", label: "Station 3", zone: "zone1", matches: numberedMatch("station", 3) },
  station4: { id: "station4", label: "Station 4", zone: "zone1", matches: numberedMatch("station", 4) },
  station5: { id: "station5", label: "Station 5", zone: "zone1", matches: numberedMatch("station", 5) },
  station6: { id: "station6", label: "Station 6", zone: "zone2", matches: numberedMatch("station", 6) },
  station7: { id: "station7", label: "Station 7", zone: "zone2", matches: numberedMatch("station", 7) },
  station8: { id: "station8", label: "Station 8", zone: "zone2", matches: numberedMatch("station", 8) },
  station9: { id: "station9", label: "Station 9", zone: "zone2", matches: numberedMatch("station", 9) },
  kickout: {
    id: "kickout",
    label: "Kick out",
    zone: "zone2",
    matches: (name) => /\bkick\s*out\b/.test(normalize(name)),
  },
};

function zoneClass(zone) {
  return ZONES.find((item) => item.key === zone)?.className || "";
}

function MapCell({ slot, station, segment, team, className = "" }) {
  const personId = station && segment ? segment.assign?.[station.id] : null;
  const assignedName = personId ? nameFor(team, personId) : "";

  return (
    <div
      className={`plant-map-cell ${zoneClass(slot.zone)} ${className}`.trim()}
      title={station ? station.name : `No process matched to ${slot.label}`}
    >
      <span className="plant-map-cell-label">{slot.label}</span>
      {station ? (
        !segment ? (
          <span className="plant-map-unlinked">Build coverage</span>
        ) : assignedName ? (
          <strong className="plant-map-person">{assignedName}</strong>
        ) : (
          <span className="plant-map-vacant">Coverage Required</span>
        )
      ) : (
        <span className="plant-map-unlinked">Not linked</span>
      )}
    </div>
  );
}

function TeamLeaderSpot({ zone, team, teamLeaders, actions }) {
  const selectedId = teamLeaders?.[zone.key] || "";
  const selected = team.find((person) => person.id === selectedId);
  const options = [...team].sort(compareFirstName);

  return (
    <div className={`team-leader-spot ${zone.className}`}>
      <div className="team-leader-title">{zone.label} Team Leader</div>
      <select
        value={selectedId}
        onChange={(event) => actions.setTeamLeader(zone.key, event.target.value || null)}
        aria-label={`${zone.label} team leader`}
      >
        <option value="">Choose team leader</option>
        {options.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name}{person.pto ? " (PTO)" : ""}
          </option>
        ))}
      </select>
      <span className={selected?.pto ? "team-leader-status pto" : "team-leader-status"}>
        {selected ? (selected.pto ? "PTO today" : "Leading this zone") : "No leader selected"}
      </span>
    </div>
  );
}

export default function MapView({ data, actions }) {
  const { stations, team, schedule, teamLeaders = {} } = data;
  const [segmentKey, setSegmentKey] = useState("q1");

  const segments = Array.isArray(schedule?.segments) ? schedule.segments : [];
  const segment = segments.find((item) => item.key === segmentKey) || segments[0] || null;

  useEffect(() => {
    if (segments.length && !segments.some((item) => item.key === segmentKey)) {
      setSegmentKey(segments[0].key);
    }
  }, [segments, segmentKey]);

  const { stationForSlot, unmatchedStations } = useMemo(() => {
    const matchedIds = new Set();
    const stationForSlot = {};

    Object.values(SLOT_DEFS).forEach((slot) => {
      const station = stations.find(
        (candidate) => !matchedIds.has(candidate.id) && slot.matches(candidate.name)
      );
      stationForSlot[slot.id] = station || null;
      if (station) matchedIds.add(station.id);
    });

    return {
      stationForSlot,
      unmatchedStations: stations.filter((station) => !matchedIds.has(station.id)),
    };
  }, [stations]);

  const cell = (slotId, className = "") => (
    <MapCell
      key={slotId}
      slot={SLOT_DEFS[slotId]}
      station={stationForSlot[slotId]}
      segment={segment}
      team={team}
      className={className}
    />
  );

  return (
    <>
      <div className="panel-head map-panel-head">
        <div>
          <span className="section-kicker">Live Floor Positioning</span>
          <h2>Unit Plant Team Map</h2>
          <p>
            See who is assigned to each station for the selected quarter. Station colors
            match the team leader responsible for that zone.
          </p>
        </div>
        <button className="btn ghost sm" onClick={() => window.print()}>
          Print Map
        </button>
      </div>

      <section className="map-toolbar" aria-label="Map controls">
        <div className="map-segments" role="group" aria-label="Production segment">
          {(segments.length ? segments : SCHEDULE_SEGMENTS).map((item) => (
            <button
              key={item.key}
              className={segment?.key === item.key || (!segment && segmentKey === item.key) ? "active" : ""}
              onClick={() => setSegmentKey(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="map-legend" aria-label="Team leader zone colors">
          {ZONES.map((zone) => (
            <span key={zone.key} className="map-legend-item">
              <i className={zone.className} /> {zone.label}
            </span>
          ))}
        </div>

        <button className="gen map-build" onClick={actions.generate}>
          {segments.length ? "Rebuild Coverage" : "Build Coverage"}
        </button>
      </section>

      {!segments.length && (
        <div className="coverage-alert map-alert">
          <span className="alert-icon">!</span>
          <div>
            <strong>Build coverage to place names on the map</strong>
            <span>
              Team leaders can be selected now. After leader changes, rebuild coverage so
              leaders are reserved from station assignments.
            </span>
          </div>
        </div>
      )}

      <div className="plant-map-scroll">
        <section className="plant-map" aria-label="Unit Plant station map">
          <div className="plant-map-caption">Parts Management</div>
          <div className="parts-management-map">
            {cell("pm3")}
            {cell("pm2")}
            {cell("pm1")}
          </div>

          <div className="sub-line-map">
            <div className="plant-map-side-label map-zone-3">Sub Line</div>
            {cell("sub4")}
            {cell("sub3")}
            {cell("sub2")}
            {cell("sub1")}
          </div>

          <div className="main-line-map">
            <div className="main-line-side map-zone-1" aria-hidden="true" />
            {cell("station2", "station-2")}
            {cell("station3", "station-3")}
            {cell("station4", "station-4")}
            {cell("station5", "station-5")}
            {cell("station6", "station-6")}
            {cell("station7", "station-7")}
            {cell("station8", "station-8")}
            <div className="main-line-right map-zone-2" aria-hidden="true" />
            <div className="main-line-aisle">MAIN LINE</div>
            {cell("station1", "station-1")}
            {cell("station9", "station-9")}
            {cell("kickout", "kickout")}
          </div>

          <div className="team-leader-row">
            {ZONES.map((zone) => (
              <TeamLeaderSpot
                key={zone.key}
                zone={zone}
                team={team}
                teamLeaders={teamLeaders}
                actions={actions}
              />
            ))}
          </div>
        </section>
      </div>

      {unmatchedStations.length > 0 && (
        <section className="map-unmatched">
          <div>
            <span className="lbl">Other Unit Processes</span>
            <p>
              These process names do not match a labeled spot in the supplied floor map,
              so they are shown here instead of being placed in the wrong location.
            </p>
          </div>
          <div className="map-unmatched-list">
            {unmatchedStations.map((station) => {
              const personId = segment?.assign?.[station.id];
              return (
                <span className="map-unmatched-chip" key={station.id}>
                  <b>{station.name}</b>
                  <span>
                    {!segment
                      ? "Build coverage"
                      : personId
                        ? nameFor(team, personId)
                        : "Coverage Required"}
                  </span>
                </span>
              );
            })}
          </div>
        </section>
      )}

      <p className="hint map-hint">
        Map matching recognizes names such as <b>Station 1–9</b>, <b>PM 1–3</b>,
        <b>Sub 1–4</b>, and <b>Kick out</b>. Zone 1 is yellow, Zone 2 is blue,
        and Zone 3 is peach to match the team-leader coverage areas.
      </p>
    </>
  );
