---
title: Event-based architecture in React (Part 1, Background)
date: 2024-05-08
tags: post
permalink: blog/posts/event-based-background
layout: _post.njk
---

## Background

First, for some background. This is an approach I've been implementing at work in my team's React application. Currently, our codebase relies heavily on `useEffect` hooks in order to respond to changes in the underlying state of the React application. There are a lot of benefits to this approach, such as the relative simplicity of the syntax and the ability to link component re-rendering to a change in state.

### Comprehensibility of the useEffect chain

One issue, however, is that our application's data flow is rather difficult to comprehend as a whole. In our application, changes in the application state are detected by components through `useEffect` hooks. Once changes are detected, these components further manipulate the application state, leading to another change in the application state. This triggers other `useEffect` callbacks in other components, et cetera et cetera.

If you were to visualize the data flow of our application, it would look something like the trajectory of a pinball ricocheting through a pinball machine.

There has to be a better way!

### The event-based approach

The event-based approach uses a rather simple publish-subscribe system. Instead of responding to state changes through a `useEffect` callback, you can instead subscribe to an event and have the callback be invoked whenever the event is explicitly dispatched. You might be thinking that this is incredibly similar to the `useEffect` approach, and that is true! Using events, however, can add a lot more intentionality to your application. When relying on `useEffects`, you have to tailor the flow of your application to changes in variable values as detected by React's shallow comparison. When using events, you can manage a complex network of inter-component communication with much more control.
