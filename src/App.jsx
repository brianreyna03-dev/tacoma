import { useState } from "react";
import { useShiftData } from "./hooks/useShiftData.js";
import TopBar from "./components/TopBar.jsx";
import Tabs from "./components/Tabs.jsx";
import BoardView from "./components/BoardView.jsx";
import TeamView from "./components/TeamView.jsx";
import StationsView from "./components/StationsView.jsx";
import CoverageView from "./components/CoverageView.jsx";

export default function App() {
  const { data, actions, storageOK, sharedStorage } = useShiftData();
  const [tab, setTab] = useState("board");
  const [openCertId, setOpenCertId] = useState(null);

  return (
    <>
      <TopBar data={data} actions={actions} />
      <Tabs
        tab={tab}
        setTab={setTab}
        team={data.team}
        stations={data.stations}
      />

      <main className="wrap">
        {!storageOK && (
          <div className="banner">
            <span>⚠</span>
            <span>
              Shared sync is not saving right now. Check the Supabase environment
              variables in Vercel, then redeploy.
            </span>
          </div>
        )}

        {tab === "board" && (
          <BoardView data={data} onGenerate={actions.generate} />
        )}
        {tab === "team" && (
          <TeamView
            data={data}
            actions={actions}
            openCertId={openCertId}
            setOpenCertId={setOpenCertId}
          />
        )}
        {tab === "stations" && <StationsView data={data} actions={actions} />}
        {tab === "coverage" && <CoverageView data={data} />}
      </main>

      <footer className="foot">
        <span className="foot-mark">TMMTX · UNIT PLANT</span>
        <span>Shift Coverage Control</span>
        <span>{sharedStorage ? "Data syncs for everyone" : "Data stays on this device"}{storageOK ? " and saves automatically." : "."}</span>
      </footer>
    </>
  );
}
