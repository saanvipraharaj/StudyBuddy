import { useNavigate } from "react-router-dom";

function LogoutButton() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        navigate("/login");
    };

    return (
        <button
            onClick={handleLogout}
            style={{
                padding: "10px 20px",
                cursor: "pointer"
            }}
        >
            Logout
        </button>
    );
}

export default LogoutButton;