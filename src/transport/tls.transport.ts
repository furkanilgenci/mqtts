import { Transport } from './transport';
import { ConnectionOptions, TLSSocket } from 'tls';
import { Socket } from 'net';

export interface TlsTransportOptions {
    host: string;
    port: number;
    additionalOptions?: ConnectionOptions;
}
export class TlsTransport extends Transport<TlsTransportOptions> {
    public duplex: TLSSocket;
    private underlyingSocket: Socket;

    constructor(options: TlsTransportOptions) {
        super(options);
        this.underlyingSocket = new Socket();
        this.underlyingSocket.setNoDelay(true);
        this.duplex = new TLSSocket(this.underlyingSocket);
        this.duplex.setNoDelay(true);

        // buffer packets until connect()
        this.duplex.cork();
    }

    connect(): Promise<void> {
        return new Promise(resolve => {
            this.underlyingSocket.connect(this.options.port, this.options.host);
            this.duplex.connect({
                ...this.options.additionalOptions,
                host: this.options.host,
                port: this.options.port,
            }, () => {
                this.duplex.uncork();
                resolve();
            });
            this.duplex.on('close', () => {
                this.underlyingSocket.end();
                this.underlyingSocket.destroy();
                this.duplex.end();
                this.duplex.destroy();
            });
        });
    }
}
