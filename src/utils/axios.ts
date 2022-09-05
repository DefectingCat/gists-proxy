import axios from 'axios';

const $ax = axios.create({
    baseURL: 'https://api.github.com',
    timeout: 0,
});

export default $ax;
