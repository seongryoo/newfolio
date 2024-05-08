---
title: Event-based architecture in React (Part 3, Full implementation)
date: 2024-05-10
tags: post
permalink: blog/posts/event-based-full
layout: _post.njk
---

## Closed event IDs

Let's start by introducing more control over the kinds of events that will be dispatched during the operation of our application. Currently, event IDs are implemented as strings, which raises the possibility of dispatching or subscribing to an event ID which does not exist. Instead, we can define an enum with all the event IDs for our application. Whenever you create a new event, you can amend the enum to add a new ID.

```ts
enum MyEventIds {
  DATA_FETCHED = "Data fetched event",
  APPLICATION_START = "Application start event",
}
```

You don't necessarily have to define MyEventIds as a string enum, but I did so since it helps with logging. Next, let's update our classes to reflect the use of the MyEventIds enum in place of strings:

MyEvent:

```ts
class MyEvent {
  id: MyEventIds;
  callbacks: (() => void)[];
  constructor(id: MyEventIds) {
    this.id = id;
    this.callbacks = [];
  }
}
```

MyEventEmitter:

```ts
interface MyEventEmitterType {
  events: { [eventId in MyEventIds]: MyEvent };
  sub: (eventId: MyEventIds, callback: () => void) => void;
  dispatch: (eventId: MyEventIds) => void;
}

export const MyEventEmitter: MyEventEmitterType = {
  events: {
    [MyEventIds.APPLICATION_START]: new MyEvent(MyEventIds.APPLICATION_START),
    [MyEventIds.DATA_FETCHED]: new MyEvent(MyEventIds.DATA_FETCHED),
  },
  ...
};
```

## Unsubscribing

With a few changes, we can also add unsubscribing to our event system.

First, we change the MyEvent class so that its `callbacks` property is an Object rather than an array. Having done this, we will be able to query the Object using a string (the listener ID) and easily access the relevant callback.

```ts
class MyEvent {
  id: MyEventIds;
  callbacks: {
    [listenerId: string]: () => void;
  };
  constructor(id: MyEventIds) {
    this.id = id;
    this.callbacks = {};
  }
}
```

Now, we can define the unsubscribing behavior in MyEventEmitter.

```ts
interface MyEventEmitterType {
  events: { [eventId in MyEventIds]: MyEvent };
  sub: (eventId: MyEventIds, listenerId: string, callback: () => void) => void;
  unsub: (eventId: MyEventIds, listenerId: string) => void;
  dispatch: (eventId: MyEventIds) => void;
}

export const MyEventEmitter: MyEventEmitterType = {
  ...
  unsub: (eventId, listenerId) => {
    const event = this.events[eventId];
    delete event.callbacks[listenerId];
  },
  dispatch: (eventId) => {
    const event = this.events[eventId];
    for (const listenerId in event.callbacks) {
        const callback = event.callbacks[listenerId];
        callback();
    }
  }
};
```

With this, we can now unsubscribe on component unmount. Let's edit our ResponderComponent to reflect this:

```ts
export const ResponderComponent = () => {
  useEffect(() => {
    const dataFetchedCallback = () => {
      // some reaction to the data being fetched
    };
    const listenerId = "responder-component";
    MyEventEmitter.sub(
      MyEventIds.DATA_FETCHED,
      listenerId,
      dataFetchedCallback
    );

    return () => {
      MyEventEmitter.unsub(MyEventIds.DATA_FETCHED, listenerId);
    };
  }, []);
};
```

## Sending data packages with event dispatch

Finally, let's add the capability for data packages to be made available to event callbacks. With this, we'll be able to
