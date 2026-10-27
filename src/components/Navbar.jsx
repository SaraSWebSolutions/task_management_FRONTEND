import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="bg-brand text-white p-4 flex justify-between">
      <h1 className="font-bold">Task Entry App</h1>

      <button onClick={logout} className="bg-red-500 px-4 py-2 rounded">
        Logout
      </button>
    </div>
  );
};

export default Navbar;
