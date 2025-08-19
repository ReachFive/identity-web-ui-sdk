import React from 'react';

export default 'svg';

const svg = React.forwardRef(function Svg(props, ref) {
    return <svg ref={ref} {...props} />;
});
export const ReactComponent = svg;
