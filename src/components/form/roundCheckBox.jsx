import React from 'react';

import styled from 'styled-components';

const Round = styled.div`
    position: relative;
    margin-right: 5px;

    > label {
        position: absolute;
        top: 0;
        left: 0;
        height: 15px;
        width: 15px;
        background-color: #fff;
        border: 1px solid #ccc;
        border-radius: 50%;
    }

    > label:after {
        position: absolute;
        top: 4px;
        left: 3px;
        height: 3px;
        width: 7px;
        border: 1px solid #fff;
        border-top: none;
        border-right: none;
        content: "";
        opacity: 0;
        transform: rotate(-45deg);
    }

    > input[type="checkbox"] {
        visibility: hidden;
    }

    > input[type="checkbox"]:checked + label {
        background-color: #66bb6a;
        border-color: #66bb6a;
    }

    > input[type="checkbox"]:checked + label:after {
        opacity: 1;
    }
`;

export const RoundCheckbox = props => <Round>
    <input type="checkbox" defaultChecked={props.checked} />
    <label />
</Round>;
