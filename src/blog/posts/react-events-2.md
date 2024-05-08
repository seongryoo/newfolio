---
title: Event-based architecture in React (Part 2, Simple implementation)
date: 2024-05-09
tags: post
permalink: blog/posts/event-based-simple
layout: _post.njk
---

This is part 2 of a series on event-based architecture in React. [Part 1 of event-based architecture series](/blog/posts/event-based-background) provides a general background about the reasoning behind this approach.

(Note that this implementation is in Typescript! The same principles can be applied with JavaScript, of course.)

## Events and EventEmitters

In my implementation, an event is an Object with an ID and a collection of callback functions. Let's start in the simplest way, by defining a Typescript interface MyEvent which has two fields, a string named `id` and an array of callback functions named `callbacks`.

```ts
class MyEvent {
  id: string;
  callbacks: (() => void)[];
  constructor(id: string) {
    this.id = id;
    this.callbacks = [];
  }
}
```

When an event occurs, we will essentially find the corresponding MyEvent object through its ID and then invoke each of its callback functions. This step will be performed by an event emitter object.

```ts
interface MyEventEmitterType {
  events: { [eventId: string]: MyEvent };
  sub: (eventId: string, callback: () => void) => void;
  dispatch: (eventId: string) => void;
}

export const MyEventEmitter: MyEventEmitterType = {
  events: {
    "application-start": new MyEvent("application-start"),
    "data-fetched": new MyEvent("data-fetched"),
  },
  sub: (eventId, callback) => {
    const event = this.events[eventId];
    if (event) {
      event.callbacks.push(callback);
    }
  },
  dispatch: (eventId) => {
    const event = this.events[eventId];
    if (event) {
      for (const callback in event.callbacks) {
        callback();
      }
    }
  },
};
```

So here, we've defined an object MyEventEmitter which has a collection of objects of type MyEvent. MyEventEmitter also has two functions, `sub` which allows for a callback to be attached to an event of a particular ID, and `dispatch` which allows for an event of a particular ID to run all its callbacks. Make sure to `export` this MyEventEmitter, because we're likely going to be using it in other files!

## Subscribing and dispatching

Now, we're ready to use our event system! First, find the spot in your application where you want to trigger an event. Perhaps it's when a user interaction occurs or when data has been successfully fetched asynchronously. All you need to then do is `import` the MyEventEmitter object and then invoke its `dispatch` function. Here's an example showing a component dispatching an event, but you can dispatch an event from anywhere! It does not need to be within a component.

```ts
import MyEventEmitter from "./MyEventEmitter.tsx";

export const FetcherComponent = () => {
  // something results in data being successfully fetched
  MyEventEmitter.dispatch("data-fetched");
};
```

And finally, we can define a component which responds to the dispatching of this event, like so:

```ts
export const ResponderComponent = () => {
  useEffect(() => {
    const dataFetchedCallback = () => {
      // some reaction to the data being fetched
    };
    MyEventEmitter.sub("data-fetched", dataFetchedCallback);
  }, []);
};
```

Note that we invoked the subscribe function within a `useEffect` hook! This, however, is simply to perform the subscribe function on the component mount. While we are trying to avoid using `useEffect` to react to changes in dependencies, this use of `useEffect` is simply the syntax by which we perform mount actions within a functional component.

## Limitations

Now, this is all well and good, but there are some additional features which I think may be helpful for our event system. One pretty big issue is that we can't unsubscribe from events. Since we subscribe to events on component mount, it makes sense that we would want to unsubscribe on component unmount. Another feature we may want to add is the sending of event data through a callback, analogous to the data which is made available to an event listener in JavaScript.
