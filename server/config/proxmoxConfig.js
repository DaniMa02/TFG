import proxmoxApi from 'proxmox-api';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const proxmox = proxmoxApi({
    host: '10.243.0.1',
    password: 'Admin1234.',
    tokenID: 'root@pam',
    port: 8006
});


export {proxmox};
