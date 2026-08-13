import { useState } from "react";
import CertEditor from "./CertEditor.jsx";

export default function PersonCard({
  person,
  stations,
  isOpen,
  onToggleOpen,
  actions,
}) {
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(person.name);

  const initials = person.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const startEditing = () => {
    setDraftName(person.name);
    setEditingName(true);
  };

  const cancelEditing = () => {
    setDraftName(person.name);
    setEditingName(false);
  };

  const saveName = () => {
    const value = draftName.trim();

    if (!value) return;

    actions.renamePerson(person.id, value);
    setEditingName(false);
  };

  return (
    <div className={"pcard" + (person.pto ? " person-pto" : "")}>
      <div className="row">
        <div className="person-identity">
          <div className="avatar" aria-hidden="true">
            {initials || "TM"}
          </div>

          <div>
            {editingName ? (
              <div className="person-name-edit">
                <input
                  type="text"
                  value={draftName}
                  autoFocus
                  aria-label={`Edit name for ${person.name}`}
                  onChange={(event) => setDraftName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      saveName();
                    }

                    if (event.key === "Escape") {
                      cancelEditing();
                    }
                  }}
                />

                <button
                  className="btn sm"
                  type="button"
                  onClick={saveName}
                >
                  Save
                </button>

                <button
                  className="btn ghost sm"
                  type="button"
                  onClick={cancelEditing}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="pname">{person.name}</div>
            )}

            <div className="person-meta">
              <span
                className={
                  person.pto
                    ? "attendance pto"
                    : "attendance active"
                }
              >
                {person.pto ? "PTO" : "On Shift"}
              </span>

              <span className="certcount">
                {person.certs.length} certified process
                {person.certs.length === 1 ? "" : "es"}
              </span>
            </div>
          </div>
        </div>

        <div className="actions">
          <span
            className="toggle"
            role="group"
            aria-label={`${person.name} attendance`}
          >
            <button
              className={person.pto ? "" : "on-here"}
              onClick={() => actions.setPTO(person.id, false)}
            >
              On Shift
            </button>

            <button
              className={person.pto ? "on-pto" : ""}
              onClick={() => actions.setPTO(person.id, true)}
            >
              PTO
            </button>
          </span>

          {!editingName && (
            <button
              className="btn ghost sm"
              type="button"
              onClick={startEditing}
            >
              Edit Name
            </button>
          )}

          <button
            className="btn ghost sm"
            onClick={onToggleOpen}
          >
            {isOpen ? "Close Skills" : "Skills / Certs"}
          </button>

          <button
            className="xbtn"
            title="Remove team member"
            aria-label={`Remove ${person.name}`}
            onClick={() => actions.removePerson(person.id)}
          >
            ×
          </button>
        </div>
      </div>

      {isOpen && (
        <CertEditor
          person={person}
          stations={stations}
          actions={actions}
        />
      )}
    </div>
  );
}
