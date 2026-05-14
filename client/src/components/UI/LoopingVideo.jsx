import React from 'react';

const LoopingVideo = ({ src, className, poster }) => {
    return (
        <video
            className={className}
            autoPlay
            loop
            muted
            playsInline
            poster={poster}
        >
            <source src={src} type="video/mp4" />
            Your browser does not support the video tag.
        </video>
    );
};

export default LoopingVideo;
