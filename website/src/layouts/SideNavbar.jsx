import { Link, useLocation } from "react-router-dom";
import { User, Users, Plus, Wallet, List } from "lucide-react";

const SideNavbar = ({groupId}) => {
  const location = useLocation();

  const navItems = [
    { to: "/friends", label: "Friends", icon: <Users size={20} /> },
    { to: "/groups", label: "Groups", icon: <Wallet size={20} /> },
    { to: "/add-expense", label: "Add", icon: <Plus size={20} />, state: groupId ? { groupId } : null,special: true },
    { to: "/expenses", label: "Expenses", icon: <List size={20} /> },
    { to: "/account", label: "Account", icon: <User size={20} /> },
  ];

  return (
    <div className="w-20 bg-[#1f1f1f] text-[#EBF1D5] py-6 px-2 h-screen flex flex-col items-center justify-center shadow-lg">
      <div className="w-full flex flex-col items-center gap-6">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;

          return (
            <Link
              key={item.to}
              to={item.to}
              state={item.state}
              className={`w-full flex flex-col items-center justify-center py-2 rounded-md transition 
                ${isActive ? "bg-[#2a2a2a] text-teal-300" : "hover:text-teal-300"}`}
            >
              {item.icon}
              <span className="text-[11px] mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default SideNavbar;
