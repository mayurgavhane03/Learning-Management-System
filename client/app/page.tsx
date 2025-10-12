"use client";
import React, { FC, useState } from "react";
import Heading from "./utils/Heading";
import Header from "./components/Header";
import Hero from "./components/Hero";
 
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Props {}

const Page: FC<Props> = (props) => {
  const [open, setOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(0);
  
  return (
    <>
      <Heading
        title="ELearning"
        description="ELearning is a platform for students to learn and get help from teachers"
        keywords="Prograaming,MERN,Redux,Machine Learning"
      />

      <Header activeItem={activeItem} open={open} setOpen={setOpen} />
      <Hero />
    </>
  );
};

export default Page;
