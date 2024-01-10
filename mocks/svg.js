export default 'svg';

import React from 'react';
const svg = React.forwardRef(function Svg(props, ref) {
    return <svg ref={ref} {...props} />
});
export const ReactComponent = svg;
