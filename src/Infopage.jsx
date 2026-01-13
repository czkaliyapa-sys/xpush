import React, { useState } from "react";
import Spinner from "./components/Spinner";


const InfoPage = () => {
return (
    <section className="flex flex-col items-center text-center p-12">
    <h1 className="text-white text-6xl mb-8">Sorry, we are working on this page</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
     <Spinner color='teal'/>
    </div>
  </section>
);

}

export default InfoPage;