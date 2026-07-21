import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventBusService {
    constructor(private readonly eventEmitter: EventEmitter2) {}

    public emit(eventName: string, payload: unknown): void {
        this.eventEmitter.emit(eventName, payload);
    }
}
