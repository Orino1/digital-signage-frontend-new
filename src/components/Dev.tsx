import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";

const raspApi = process.env.NEXT_PUBLIC_RP_API;
const androidApi = process.env.NEXT_PUBLIC_TV_API;

const Dev: React.FC = ({ setClicksCounter }) => {
    const router = useRouter();
    const [phrase, setPhrase] = useState<string>("");
    const [raspSetups, setRaspSetups] = useState<null | Array<any>>(null);
    const [androidSetups, setAndroidSetups] = useState<null | Array<any>>(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (phrase !== "synchronize all setups") {
            alert("The phrase you entered is not correct. Please try again.");
            return;
        }

        const token = localStorage.getItem("authToken");
        const res = await fetch(`${androidApi}scheduled_playlists/sync`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(raspSetups),
        });

        if (res.ok) {
            window.location.reload();
        } else {
            console.error("Unable to sync setups")
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            router.push("/login");
            return;
        }

        const fetchData = async () => {
            const [raspRes, androidRes] = await Promise.all([
                fetch(`${raspApi}scheduled_playlists`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),
                fetch(`${androidApi}scheduled_playlists`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),
            ]);

            const [raspData, androidData] = await Promise.all([
                raspRes.json(),
                androidRes.json(),
            ]);

            setRaspSetups(raspData);
            setAndroidSetups(androidData);
            console.log(raspData);
        };

        fetchData();
    }, []);
    return (
        <form
            onSubmit={handleSubmit}
            style={{
                width: "100vw",
                height: "100vh",
                zIndex: 2000,
                position: "fixed",
                top: 0,
                left: 0,
                backgroundColor: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
                gap: "1rem",
                fontFamily: "sans-serif",
                color: "#333",
                boxSizing: "border-box",
            }}
        >
            {/* Close Button */}
            <button
                type="button"
                onClick={() => setClicksCounter(0)}
                style={{
                    position: "absolute",
                    top: "20px",
                    right: "20px",
                    backgroundColor: "#e74c3c",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "2.5rem",
                    height: "2.5rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1rem",
                }}
            >
                <FontAwesomeIcon icon={faTimes} />
            </button>

            <h2 style={{ marginBottom: "1rem" }}>
                Setup Synchronization Panel
            </h2>

            <p style={{ fontSize: "1rem" }}>
                Total Raspberry Pi setups: <strong>{raspSetups?.length}</strong>
            </p>
            <p style={{ fontSize: "1rem" }}>
                Total Android TV setups:{" "}
                <strong>{androidSetups?.length}</strong>
            </p>
            <p style={{ fontSize: "1rem" }}>
                Difference in setups:{" "}
                <strong>{raspSetups?.length - androidSetups?.length}</strong>
            </p>

            <p style={{ textAlign: "center", maxWidth: "600px" }}>
                To start syncing, please type the following phrase below
                exactly:
                <br />
                <span
                    style={{
                        fontWeight: "bold",
                        color: "#3498db",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        msUserSelect: "none",
                        MozUserSelect: "none",
                    }}
                >
                    synchronize all setups
                </span>
            </p>

            <input
                type="text"
                placeholder="Type synchronize all setups"
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                style={{
                    padding: "0.75rem 1rem",
                    width: "100%",
                    maxWidth: "400px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    fontSize: "1rem",
                }}
            />

            <button
                type="submit"
                style={{
                    backgroundColor: "#2ecc71",
                    color: "#fff",
                    padding: "0.75rem 2rem",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    cursor: "pointer",
                    marginTop: "0.5rem",
                }}
            >
                Synchronize Now
            </button>
        </form>
    );
};

export default Dev;
