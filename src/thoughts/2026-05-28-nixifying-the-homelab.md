---
title: Nixifying the Homelab
subtitle: Everything declarative. As it should be.
date: 2026-05-28T22:48:44.664Z
image: /assets/media/terraform-nix-nomad.png
imageAlt: 'Terraform, Nix, Nomad icons'
tags:
  - nix
  - homelab
---

Over the past few years, I have been running a homelab and trying to host my own local software, much like many others in the self-hosted community.

I started by running a Docker instance on my local computer. I then moved on to upcycling some old hardware into an always-online server, and finally arrived where I am today: running multiple dedicated units hosting dozens of services (*like this website*) that I and many others use regularly.

I have to say, it has been a rewarding experience, yet simultaneously a miserable time of debugging and configuring when you just want to get on about your day and use your local services. Over these last few months, though, I think I have finally landed on something that is (for the most part) set and forget.

## The Past

Originally, I kept everything in a large `docker-compose` file like anyone starting out. However, after the first few services, that approach becomes unwieldy and a real pain to run on the same system you want to use for other demanding tasks.

The next step was moving to Proxmox and managing a Docker VM with other containers floating around as needed. This, in its own right, was much better than before. Never needing to stop services to free up resources, having everything always online and ready to go, and having any OS available to spin up at any time provided massive benefits. However, new problems started to creep in. Keeping VMs up to date, managing system software, maintaining configuration files, and doing it all remotely presented a new challenge. Luckily for me, this was the perfect excuse to finally pick up [Ansible for DevOps](https://www.ansiblefordevops.com/) and tackle learning some automation outside of rolling my own shell scripts.

Over the course of refactoring and moving everything into simple Ansible automations, I thought I had finally hit a nice balance. Jinja templates are excellent for managing all the service configuration files, especially those that rely on the same data. Managing the bootstrapping of a new system and keeping it up to date became a simple task that could be run at any time. Even Docker containers could be maintained through the Docker community task. But one thing was still bothering me, and it cropped up a few times: the system could get out of sync. Dependencies would update and require manual debugging, or I would even have to rebuild the system just to bootstrap it again through a fragile process, hoping to end up in the system state I originally planned for.

## The Present

Since starting my homelab, I was tangentially progressing down my Nix journey ([config.nix](https://github.com/MorganKF/config.nix)). I started by running a WSL instance of NixOS and slowly branched out to configuring my MacBook and other computers using Nix. The ease of maintaining a single source of truth and having all your devices contain the exact environment you expect is nothing short of magic. Eventually, I realized it would be amazing to get all the benefits of NixOS (idempotent system configuration, system rollback, Nix packages) without the pitfalls of running simple Ansible tasks on Debian. Even better: what if everything was Nix, using one language to run the whole thing?

### Terraform

The first thing I wanted to tackle was the blasted provisioning. I had looked into Terraform before, but learning another DSL and toolchain was just too much at the time; it was easier to just throw up a new Debian instance and call it a day. While searching around, however, I found the [terranix](https://terranix.org/) project. Configuring the infrastructure directly in Nix was possible, so I gave it a shot.

As it turns out, getting up and running isn't too difficult. You can simply export your configuration with `terranix.lib.terranixConfiguration` and pass in a Nix configuration to generate a Terraform JSON file. With the added benefit of using the Nix language, we can run functions or loops to generate multiple configs from the same base configuration. Since I decided to run Nomad with the intent of eventually scaling a cluster, I ended up generating a simple server configuration:

<div class="code-header">nomad_server.nix</div>

```nix
{
  cores = 6;
  memory = 4096;
  onboot = true;
  agent = 1;
  startup = "order=1,up=30";
  scsihw = "virtio-scsi-pci";
  os_type = "cloud-init";
  tags = "homelab.nix";
    serial = {
    id = 0;
    type = "socket";
  };
  boot = "order=scsi0";
  # Extra disk setup...
}
```

From there, you can simply extend that into the client configuration:

<div class="code-header">nomad_client.nix</div>

```nix
{ lib }:
let
  nomadServer = import ./nomad-server.nix;
in
lib.recursiveUpdate nomadServer {
  cores = 8;
  memory = 16384;
}
```

Wrap that up with a few other required properties like your provider and target, and bam! We get a `config.tf.json` built that we can execute.

### NixOS

The next required piece is the actual OS. I couldn't quite get NixOS to build a proper `cloud-init` image, so for now, Terraform clones a Debian template with `cloud-init` enabled. Once that returns successfully, we continue by running [nixos-anywhere](https://nix-community.github.io/nixos-anywhere/), which allows us to reboot the server with `kexec` into the NixOS installer and set up the OS along with our configuration.

Now that we have NixOS running, setting up the rest of the required software is quite trivial. I can forgo traditional software management tasks and simply enable any services I need. For example, I need SSH enabled on each server, so that is as simple as placing `programs.ssh.startAgent = true;` into a shared configuration file and then importing it on the desired system with `imports = [ ./shared-config.nix ];`.

How about enabling Consul? That can be turned on via `services.consul.enable = true;`. As for the configuration, that is also fully available inside Nix. We can throw any config settings inside `services.consul.extraConfig`, and it will generate the appropriate output file and place it in the correct directory for us. How convenient!

Along with the ease of setting up the default system state, we also get massive benefits from the fact that our system is locked to its current packages via the `flake.lock` file. Looking to do a system update? It is now as simple as running `nix flake update` and `nix run .#deploy`. Something broke and services are down? Just revert the lock file and deploy it again. Even better, if something is really out of whack, we can just tear down the whole thing and build it again from scratch, leaving us with the exact system we started with. No more worrying about system state drifting.

### Nomad

The next challenge was Nomad. I wanted something a little more powerful than Docker and wanted to completely skip over Docker Swarm, but I wasn't quite ready to dive into Kubernetes. I needed to get my setup back in order to start adding a few new services I had been eyeing. That led me to try out Nomad.

System configuration was quite simple: just `services.nomad.enable = true;` on the server and client with a few extra knobs to flick, and both could find each other. The harder part was how to actually configure the jobs. There seemed to be a few projects floating around (similar to terranix) attempting to bridge Nomad job configuration and the Nix language, but for the most part, they seemed abandoned. I didn't want to give up on writing everything in Nix, so I went with a workaround.

Nomad supports JSON configuration just like Terraform, so we can easily write our config in the Nix language and convert it to JSON files using `builtins.toJSON`. It may not be as elegant as terranix's wrappers, but it means I don't have to split the codebase. Now we can throw up a job fairly trivially:

<div class="code-header">web.nix</div>

```nix
{ helpers, ... }:
{
  job.web = {
    datacenters = [ "dc1" ];
    type = "service";
    group.web = {
      network = { port.http = { to = 80; }; };
      service = {
        name = "web";
        port = "http";
        tags =
          helpers.traefik.https {
            name = "web-mkf";
            host = "mkf.dev";
          }
      };
      task.web = {
        driver = "docker";
        config = {
          image = "nginx:stable";
          ports = [ "http" ];
          volumes = [
            "/mnt/nas/services/web:/usr/share/nginx/html:ro"
          ];
        };
        resources = {
          cpu = 1000;
          memory = 1024;
        };
      };
    };
  };
}
```

We can even bring in Nix functions like `helpers.traefik.https` to generate all the tags we need for Traefik to discover the new service.

## The Future

Hopefully soon I can get this project cleaned up enough that I can actually share the full source. I have a few keys hard-coded that ideally stays secure and not available for every crawler, AI, and curious individual looking for secrets.

This setup could be interesting for anyone looking to take the next step with Nix in their homelab, even if they don't want to manage *everything* with it. At the very least, it might spark some ideas.

In the meantime, I have a few other improvements in mind:

* Investigating the removal of HashiCorp Vault in favor of moving entirely to SOPS, potentially using [sops-nix](https://github.com/mic92/sops-nix).
* Replacing some deployment glue scripts with a dedicated tool like [Colmena](https://github.com/zhaofengli/colmena).
* Getting NixOS `cloud-init` building directly to remove the installation step, moving to a purely local build and publish workflow.
* Investigating replacing the HashiCorp stack with k3s

But for now, if you're seeing this, it's working.
