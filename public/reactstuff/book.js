'use strict';
//import React from 'react';
const e = React.createElement;

class UserPanel extends React.Component {
    constructor(props) {
        super(props);
        this.message;
    }
    componentDidMount() {
        this.message = "poopy"
    }
    render() {
        socketio.emit
        return (
            <p> lol, {this.props.name}</p>
        );
    }


}
ReactDOM.render(
    <UserPanel name="your username" />,
    document.getElementById('user-header')
);