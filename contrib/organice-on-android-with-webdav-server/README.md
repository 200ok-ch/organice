# Setting up a local version of organice on Android

Author:
  - Matrix: @AppAraat:matrix.org
  - https://matrix.to/#/!DfVpGxoYxpbfAhuimY:matrix.org/$D-xaDZAoRjIOgJrancXIy7Yf2_cq0IeMf1UtSRQRyyY?via=matrix.org&via=kde.org&via=chat.physics.ac

Suppose you know you're going to a place with no network connectivity. If you just use the [hosted version of organice](https://organice.200ok.ch/), you might be in a bad situation if you decide to reboot your phone (or if you (or your Android) decide to kill your browser). You won't be able to reach https://organice.200ok.ch/ because... you have no network connectivity. So what now?

Luckily you can build a locally hosted version of organice on your Android. All it requires is Termux and a few packages that are going to be installed through it.

Termux does not adhere to the FHS, so there are 2 main directories to be aware of in Termux:

* `/data/data/com.termux/files/usr/` - This replaces directories such as `/bin/`, `/etc/`, `/usr/` or `/var/`. This is where packages are installed and is assigned to the environment variable `$PREFIX`.
* `/data/data/com.termux/files/home/` - This is your home directory, also assigned to `$HOME` variable and accessible through simply executing `cd`.
	* `/data/data/com.termux/files/home/storage/` (a.k.a. `~/storage/`) - Contains symlinks to your storage framework. Only accessible if you correctly run `termux-setup-storage`. [More info here.](https://wiki.termux.com/wiki/Internal_and_external_storage)


### Installation of packages
First we have to install all the necessary packages:

* `pkg install git nodejs-lts yarn`
	* Note that as of 2020-08-28, the required version of Node.js for compiling organice is `v12.13.1`, however, the `nodejs-lts` package is on `v12.18.3`. This may lead to some undefined behavior. To install a specific Node.js version in Termux means that you have to build it yourself: https://wiki.termux.com/wiki/Building_packages
* `git clone --depth=1 https://github.com/200ok-ch/organice`

### Now we build!
* `cd organice`
* `yarn install` - This should build organice.
* `yarn start` - This should run it. This might take a while though. Your browser should automatically open up.


## Building `hacdias/webdav`
If you want to also have a local WebDAV server installed, follow these steps:

* `pkg install golang`
* `git clone --depth=1 https://github.com/hacdias/webdav`
* `cd webdav`
* `go build` - After this there should appear a binary file called `webdav`.
* `./webdav -c /path/to/your/webdav-config.yaml` - I recommend these settings in your config: http://ix.io/2vuX
