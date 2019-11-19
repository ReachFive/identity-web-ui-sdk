export default 'svg';

import React from 'react';
const svg = React.forwardRef((props, ref) => <svg ref={ref} {...props} />);
export const ReactComponent = svg;
