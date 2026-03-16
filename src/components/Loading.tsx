"use client";
// import React from "react";
import { AiOutlineLoading } from "react-icons/ai";

export default function Loading() {
  
  return (
    <main className="h-screen w-screen flex flex-col justify-center items-center">
        <div className="flex flex-col justify-center items-center gap-y-4">
          <AiOutlineLoading className="animate-spin text-4xl md:text-5xl" />
          <div>Carregando</div>
        </div>
    </main>
  );
}
