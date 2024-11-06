import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div>
            <h1>Welcome to the Quote App</h1>
            <Link to="/quotes">Get Quotes</Link>
        </div>
    );
};

export default Home;
