---
title: Simple event-based architecture in React with TypeScript
date: 2024-05-09
tags: post
permalink: /blog/posts/event-based-architecture
layout: _post.njk
---

## Background

Some time ago, I started implementing an event-based architecture for one of the React applications at my job. This particular React app is a large, complex project that relies heavily on `useEffect` in order to control the flow of the data. A great many of our components have `useEffect`s which watch for changes in the underlying application state and perform actions upon said changes. This approach does have certain benefits, such as a relatively simple syntax and the ability to tie re-rendering with changes in application state.

However, it does have a number of drawbacks. Some include the issue of concurrency/race conditions (e.g., if two separate components have `useEffect` hooks monitoring the change in the same stored value, then which component will execute its response first?) and difficulty debugging. But most of all, I think the utilization of `useEffect` to control the flow of data in our application results in a problem of comprehensibility.

Often, our application chains `useEffects` together. For instance, a change in the application state will trigger a `useEffect` callback in Component A, which will then perform certain transformations to the application state. This transformation then triggers a `useEffect` callback in Component B, which modifies the application state further, and so on. There is no clear start or end to our data flow, and there is no straightforward way to identify the next or previous step in the `useEffect` chain. Visualizing in your head the `useEffect`-based data flow of our application often results in the image of the application state ricocheting off of component to component like a pinball shooting between bumpers. Not only does this make work more time-consuming for developers already familiar with the codebase, it also ends up being a large hurdle for developers who are just joining the project, as a holistic understanding of our pinball-machine data flow must often be built up through gradual exposure to different components in the applicaiton.

## The alternative: an event-based architecture

In order to address this issue, I started to implement a simple publish-subscribe event system which will be able to perform the same duties as our `useEffect`-driven data flow without the complex nature of `useEffect` chaining. To set up this system, we need to first identify what we mean by an "event."

### What is an Event?

For our purposes, an Event is a specific, named occurence which happens within the lifecycle of a React application. An Event has an ID and a collection of callbacks, which are all invoked upon the dispatching of the Event. An Event also has the ability to pass a data package to its callback functions upon dispatching.

### A warning!

This event-based system does have some limitations. For me, the most glaring has been the difficulty in accessing state and store variables from within a callback. For instance, consider a rather innocuous-looking snippet of code in which we try to access the value of a `useState` variable from within a callback function.

```ts
const [count, setCount] = useState(0);

// some code in which setCount(100) is invoked

const onEventDispatch = () => {
  console.log(count); // always 0!
};
```

If we were to subscribe to one of our events with the `onEventDispatch` callback, then the value of `count` would always be `0`. There are two ways to handle this issue: the first is to favor passing in data through the callback parameter (more on this later), which always ensures that you have access to the correct data, bypassing many concurrency issues. Another way to handle this is by wrapping the `useState` variable in a `useRef`.

```ts
const [count, setCount] = useState(0);
const statelessCount = useRef<number>(count);

// some code in which setCount(100) is invoked

const onEventDispatch = () => {
  console.log(statelessCount.current); // prints 100
};
```

## Before: a bit of code using `useEffect`

Let's begin by observing a React component which watches a store value (`score`) and responds to any changes in said value. When a change to `score` (the underlying application state) occurs, our component will print out a message to the console using the most recent value of `score`. Here is the component with its behavior implemented via the `useEffect` pattern:

```ts
export const ScoreWatcher = () => {
  // obtain value of score from a store
  useEffect(() => {
    console.log("Game over. Score: " + score);
  }, [score]);
};
```

This is simple enough, but imagine ten or twenty more different components which all respond to a change in the `score` value. At a certain project scale, it becomes very difficult to follow the flow of the data.

## After: implementing the event system

### Defining the LifeEvent class

Implementing the event system will require some more setup on our end. First, let's begin by creating an `enum` which encapsulates all the different possible events which can occur in the lifecycle of our application. This does not have to be exhaustive, as you are meant to expand this list whenever you need to create a new linked behavior. In our case, the event we want to capture is a change in the score.

```ts
enum LifeEventIds {
  SCORE_CHANGED = "Score changed",
  // I like to use string enums since it is helpful for logging,
  // but that part is optional.
}
```

Then, let's define our `LifeEvent` type itself. Our `LifeEvent` object will have a unique ID and a collection of callbacks to invoke when dispatched.

```ts
class LifeEvent {
  id: LifeEventIds;
  // We use a key-value Object for our callback collection
  // as this allows us to quickly query a callback collection for
  // the specific listenerId, which is needed for unsubscribing a listener.
  callbacks: {
    [listenerId: string]: (data: LifeEventData) => void;
  };
  constructor(eventId: LifeEventIds) {
    this.id = eventId;
    this.callbacks = {};
  }
}
```

### Sending data packages on dispatch with LifeEventData

You may have noticed that the callbacks have a parameter of type `LifeEventData`. This represents the data package which can be sent by a `LifeEvent` to its callback functions. For this implementation, we want a system which will allow us to define the structure of the `LifeEventData` for each different `LifeEvent`. For our `LifeEventIds.SCORE_CHANGED` event, the most relevant piece of data would likely be the current `score`.

```ts
export const LifeEventData = {
  // There is an entry for each possible event
  [LifeEventIds.SCORE_CHANGED]: {
    score: number,
  },
};
```

### The event emitter

Now, let's create an object which can store all the `LifeEvent`s and perform actions on them (e.g., subscribing, unsubscribing, dispatching). Here is the type definition for such an item.

```ts
interface LifeEventEmitterType {
  events: {
    [eventId in LifeEventIds]: LifeEvent;
  };
  sub: (
    eventId: LifeEventIds,
    listenerId: string,
    callback: (data: LifeEventData) => void
  ) => void;
  unsub: (eventId: LifeEventIds, listenerId: string) => void;
  dispatch: (eventId: LifeEventIds, data: LifeEventData) => void;
}
```

And then, the actual object itself:

```ts
export const LifeEventEmitter = {
  events: {
    [LifeEventIds.SCORE_CHANGED]: new LifeEvent(LifeEventIds.SCORE_CHANGED),
  },
  sub: (eventId, listenerId, callback) => {
    const event = this.events[eventId];
    event.callbacks[listenerId] = callback;
  },
  unsub: (eventId, listenerId) => {
    const event = this.events[eventId];
    delete event.callbacks[listenerId];
  },
  dispatch: (eventId, data) => {
    const event = this.events[eventId];
    for (const listenerId of event.callbacks) {
      const callback = event.callbacks[listenerId];
      if (callback) {
        callback(data);
      }
    }
  },
};
```

### Dispatching an event

Next, let's handle dispatch of the score change event. Dispatching is rather simple. It does not need to be performed within a component, but it can be!

```ts
const data: LifeEventData = {
  [LifeEventIds.SCORE_CHANGED]: {
    score: 100,
  },
};
LifeEventEmitter.dispatch(LifeEventIds.SCORE_CHANGED, data);
```

### Subscribing to an event

Finally, let's rewrite our original `ScoreWatcher` component to use the new event system instead of the `useEffect` system:

```ts
export const ScoreWatcher = () => {
  // obtain value of score from a store
  useEffect(() => {
    const listenerId = "score-watcher";

    const callback: (data: LifeEventData) => void = (data) => {
      const eventData = data[LifeEventIds.SCORE_CHANGED];
      console.log("Game over. Score: " + eventData.score);
    };

    LifeEventEmitter.sub(LifeEventIds.SCORE_CHANGED, listenerId, callback);
    return () => {
      LifeEventEmitter.unsub(LifeEventIds.SCORE_CHANGED, listenerId);
    };
  }, []);
};
```

## Conclusion
