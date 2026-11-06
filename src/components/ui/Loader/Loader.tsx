"use client";

import React from "react";
import { Dialog } from "primereact/dialog";
import classes from "./Loader.module.css";

interface LoaderProps {
    visible: boolean;
    onHide?: () => void;
}

const Loader: React.FC<LoaderProps> = ({ visible, onHide }) => {
    return (
        <Dialog
            visible={visible}
            modal
            onHide={onHide || (() => { })}
            showHeader={false}
            closable={false}
            draggable={false}
            resizable={false}
            blockScroll
            style={{
                width: "100vw",
                height: "100vh",
                maxWidth: "100%",
                maxHeight: "100%",
                padding: 0,
                background: "rgba(255, 255, 255, 0.4)",
            }}
            contentStyle={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                background: "transparent",
            }}
        >
            <span className={classes.Loader} />
        </Dialog>
    );
};

export default Loader;
