import React from "react";

// Expose React globally for components that use JSX (React.createElement)
// in Node environment where React is not automatically available.
globalThis.React = React;
