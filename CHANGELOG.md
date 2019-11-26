## [6.0.4](https://github.com/makeomatic/mservice-social/compare/v6.0.3...v6.0.4) (2019-11-26)


### Bug Fixes

* do not schedule sync when close called ([d4a905d](https://github.com/makeomatic/mservice-social/commit/d4a905ded3a88167648bcb867885efc316d02984))
* instagram logging, default data ([e987b9d](https://github.com/makeomatic/mservice-social/commit/e987b9d3f7008b5386d8a65afdb627db9138fa3d))

## [6.0.3](https://github.com/makeomatic/mservice-social/compare/v6.0.2...v6.0.3) (2019-11-26)

## [6.0.2](https://github.com/makeomatic/mservice-social/compare/v6.0.1...v6.0.2) (2019-11-26)

## [6.0.1](https://github.com/makeomatic/mservice-social/compare/v6.0.0...v6.0.1) (2019-11-16)


### Bug Fixes

* wrap err array into object ([37d1943](https://github.com/makeomatic/mservice-social/commit/37d1943c81ed03020d79e0863b1d3479766d0f65))

# [6.0.0](https://github.com/makeomatic/mservice-social/compare/v5.0.5...v6.0.0) (2019-11-16)


### Bug Fixes

* update deps ([9141ec1](https://github.com/makeomatic/mservice-social/commit/9141ec18a647aaf893ba5a68088188a4c2594b29))


### Features

* upgrade deps for node 12 and latest [@microfleet](https://github.com/microfleet) ([#54](https://github.com/makeomatic/mservice-social/issues/54)) ([ed2b911](https://github.com/makeomatic/mservice-social/commit/ed2b911c4fae9e622e83ef6f9c0e9b79195eb5e6))


### BREAKING CHANGES

* knex@0.20.x, node 12 as mainline, microfleet/core@15 and so on
public APIs remain stable, but some underlaying configuration has changed so one must be careful to adjust it. overall upgrade time is small

## [5.0.5](https://github.com/makeomatic/mservice-social/compare/v5.0.4...v5.0.5) (2019-03-12)


### Bug Fixes

* **fb:** adhere to 3.1 graph api changes ([#52](https://github.com/makeomatic/mservice-social/issues/52)) ([7ee92d9](https://github.com/makeomatic/mservice-social/commit/7ee92d9))

## [5.0.4](https://github.com/makeomatic/mservice-social/compare/v5.0.3...v5.0.4) (2019-03-11)


### Bug Fixes

* remove inaccessible account ([c3a3185](https://github.com/makeomatic/mservice-social/commit/c3a3185))

## [5.0.3](https://github.com/makeomatic/mservice-social/compare/v5.0.2...v5.0.3) (2019-03-11)


### Bug Fixes

* improved twitter logs ([8b7d99f](https://github.com/makeomatic/mservice-social/commit/8b7d99f))
* invalid handling on fb sync, tw error ([3a101dd](https://github.com/makeomatic/mservice-social/commit/3a101dd))

## [5.0.2](https://github.com/makeomatic/mservice-social/compare/v5.0.1...v5.0.2) (2019-03-11)


### Bug Fixes

* node 10.15.3 ([cdb80b6](https://github.com/makeomatic/mservice-social/commit/cdb80b6))

## [5.0.1](https://github.com/makeomatic/mservice-social/compare/v5.0.0...v5.0.1) (2019-02-18)


### Bug Fixes

* node 10.15.1 ([66050bf](https://github.com/makeomatic/mservice-social/commit/66050bf))

# [5.0.0](https://github.com/makeomatic/mservice-social/compare/v4.5.0...v5.0.0) (2019-02-10)


### Features

* prometheus ([#51](https://github.com/makeomatic/mservice-social/issues/51)) ([70c2bf2](https://github.com/makeomatic/mservice-social/commit/70c2bf2))


### BREAKING CHANGES

* upgrade @microfleet/core to 13.x.x series

# [4.5.0](https://github.com/makeomatic/mservice-social.git/compare/v4.4.6...v4.5.0) (2018-12-26)


### Features

* **tokens:** invalidate ig/fb tokens, sync only valid feeds, add tests ([#50](https://github.com/makeomatic/mservice-social.git/issues/50)) ([b5ee751](https://github.com/makeomatic/mservice-social.git/commit/b5ee751))

## [4.4.6](https://github.com/makeomatic/mservice-social.git/compare/v4.4.5...v4.4.6) (2018-12-24)


### Bug Fixes

* **facebook.media:** add `page.future` param option ([#49](https://github.com/makeomatic/mservice-social.git/issues/49)) ([8ed2516](https://github.com/makeomatic/mservice-social.git/commit/8ed2516))

## [4.4.5](https://github.com/makeomatic/mservice-social.git/compare/v4.4.4...v4.4.5) (2018-12-15)


### Bug Fixes

* **twitter:** add index on account field ([#48](https://github.com/makeomatic/mservice-social.git/issues/48)) ([f24c36f](https://github.com/makeomatic/mservice-social.git/commit/f24c36f))

## [4.4.4](https://github.com/makeomatic/mservice-social.git/compare/v4.4.3...v4.4.4) (2018-12-07)


### Bug Fixes

* logger statemensts ([#47](https://github.com/makeomatic/mservice-social.git/issues/47)) ([1b88681](https://github.com/makeomatic/mservice-social.git/commit/1b88681))

## [4.4.3](https://github.com/makeomatic/mservice-social.git/compare/v4.4.2...v4.4.3) (2018-12-06)


### Bug Fixes

* feed.remove assertion handling, twitter pub only for following accs ([#46](https://github.com/makeomatic/mservice-social.git/issues/46)) ([4616d12](https://github.com/makeomatic/mservice-social.git/commit/4616d12))

## [4.4.2](https://github.com/makeomatic/mservice-social.git/compare/v4.4.1...v4.4.2) (2018-12-04)


### Bug Fixes

* releaserc.json ([#44](https://github.com/makeomatic/mservice-social.git/issues/44)) ([8c20a29](https://github.com/makeomatic/mservice-social.git/commit/8c20a29))
* use timeout.refresh() ([#45](https://github.com/makeomatic/mservice-social.git/issues/45)) ([91f7022](https://github.com/makeomatic/mservice-social.git/commit/91f7022))

## [4.4.1](https://github.com/makeomatic/mservice-social.git/compare/v4.4.0...v4.4.1) (2018-12-04)


### Bug Fixes

* bump deps ([#43](https://github.com/makeomatic/mservice-social.git/issues/43)) ([7be41d6](https://github.com/makeomatic/mservice-social.git/commit/7be41d6))
* releaserc.json ([#44](https://github.com/makeomatic/mservice-social.git/issues/44)) ([8c20a29](https://github.com/makeomatic/mservice-social.git/commit/8c20a29))

## [4.4.1](https://github.com/makeomatic/mservice-social.git/compare/v4.4.0...v4.4.1) (2018-12-04)


### Bug Fixes

* bump deps ([#43](https://github.com/makeomatic/mservice-social.git/issues/43)) ([7be41d6](https://github.com/makeomatic/mservice-social.git/commit/7be41d6))

# [4.4.0](https://github.com/makeomatic/mservice-social.git/compare/v4.3.1...v4.4.0) (2018-12-03)


### Features

* **twitter:** add extended_entities ([#41](https://github.com/makeomatic/mservice-social.git/issues/41)) ([cf80cc1](https://github.com/makeomatic/mservice-social.git/commit/cf80cc1))

## [4.3.1](https://github.com/makeomatic/mservice-social.git/compare/v4.3.0...v4.3.1) (2018-11-30)


### Bug Fixes

* edited user image url ([#40](https://github.com/makeomatic/mservice-social.git/issues/40)) ([36d6ec9](https://github.com/makeomatic/mservice-social.git/commit/36d6ec9))

# [4.3.0](https://github.com/makeomatic/mservice-social.git/compare/v4.2.0...v4.3.0) (2018-11-29)


### Features

* extended feed.read method ([#39](https://github.com/makeomatic/mservice-social.git/issues/39)) ([d69ee39](https://github.com/makeomatic/mservice-social.git/commit/d69ee39))

# [4.2.0](https://github.com/makeomatic/mservice-social.git/compare/v4.1.3...v4.2.0) (2018-11-29)


### Features

* added user image to tweet data ([#38](https://github.com/makeomatic/mservice-social.git/issues/38)) ([6911f81](https://github.com/makeomatic/mservice-social.git/commit/6911f81))

## [4.1.3](https://github.com/makeomatic/mservice-social.git/compare/v4.1.2...v4.1.3) (2018-11-19)


### Bug Fixes

* slightly modified validator config ([#37](https://github.com/makeomatic/mservice-social.git/issues/37)) ([c4167aa](https://github.com/makeomatic/mservice-social.git/commit/c4167aa))

## [4.1.2](https://github.com/makeomatic/mservice-social.git/compare/v4.1.1...v4.1.2) (2018-11-16)


### Bug Fixes

* **twitter:** unify published messages scheme ([#36](https://github.com/makeomatic/mservice-social.git/issues/36)) ([df25d82](https://github.com/makeomatic/mservice-social.git/commit/df25d82))

## [4.1.1](https://github.com/makeomatic/mservice-social.git/compare/v4.1.0...v4.1.1) (2018-10-30)


### Bug Fixes

* custom config via NCONF_FILE_PATH ([#35](https://github.com/makeomatic/mservice-social.git/issues/35)) ([744af80](https://github.com/makeomatic/mservice-social.git/commit/744af80))

# [4.1.0](https://github.com/makeomatic/mservice-social/compare/v4.0.0...v4.1.0) (2018-10-27)


### Features

* add notifier service to broadcast updates of watched entities ([#34](https://github.com/makeomatic/mservice-social/issues/34)) ([60dc679](https://github.com/makeomatic/mservice-social/commit/60dc679))

# [4.0.0](https://github.com/makeomatic/mservice-social/compare/v3.2.0...v4.0.0) (2018-10-04)


### Features

* upgrade all deps ([#33](https://github.com/makeomatic/mservice-social/issues/33)) ([43d2765](https://github.com/makeomatic/mservice-social/commit/43d2765))


### BREAKING CHANGES

* requires node 10, updated semantic-release pipeline
