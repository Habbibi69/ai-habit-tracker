import { UserButton } from "@clerk/nextjs";
import React from "react";
import AddNewHabit from "./_components/AddNewHabit";
import HabitList from "./_components/HabitList";

const Dashboard = () => {
  return (
    <div className="p-10">
      <h2 className="font-bold text-2xl">Dashboard</h2>
      <h2 className="text-gray-500">Track your daily habits with AI support</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 my-5">
        <AddNewHabit />
      </div>

      <HabitList />
    </div>
  );
};

export default Dashboard;