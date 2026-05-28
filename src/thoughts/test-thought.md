---
title: Building a test post
subtitle: A test for embeds
date: 2026-05-27
tags: ["rust", "nix"]
image: https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80
imageAlt: A close up of a circuit board.
---

## Testing
Here is a test post

<div class="code-header">test_file.rs</div>

```rust
pub fn main() {
    println!("Text");
}
```
## Testing
Here is a test post

<div class="code-header">test_file.rs</div>

```rust
pub fn main() {
    println!("Text");
}
```
### Sub Testing Nix
Here is a test post

<div class="code-header">test_file.nix</div>

```nix
{
  apiVersion = 1;
  datasources = [
    {
      name = "Loki";
      type = "loki";
      access = "proxy";
      url = "http://loki.service.consul:3100";
      isDefault = true;
      jsonData.maxLines = 5000;
    }
  ];
}
```
## Testing
Here is a test post

<div class="code-header">test_file.rs</div>

```rust
pub fn main() {
    println!("Text");
}
```
## Testing
Here is a test post

<div class="code-header">test_file.rs</div>

```rust
pub fn main() {
    println!("Text");
}
```
## Testing
Here is a test post

<div class="code-header">test_file.rs</div>

```rust
pub fn main() {
    println!("Text");
}
```
## Testing
Here is a test post

<div class="code-header">test_file.rs</div>

```rust
pub fn main() {
    println!("Text");
}
```
