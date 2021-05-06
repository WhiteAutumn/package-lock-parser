import path from "path";
import fs from "fs/promises";
import { expect } from "chai";
import { parse, fabricate } from "./index.mjs";

const __dirname = path.dirname(import.meta.url.replace("file:///", ""));
const testDir = path.join(__dirname, "test");

const basicPackageLock = fs.readFile(path.resolve(testDir, "basic_package-lock.json"))
  .then(it => JSON.parse(it));

const basicDevPackageLock = fs.readFile(path.resolve(testDir, "basic_with_dev_package-lock.json"))
  .then(it => JSON.parse(it));

const deepPackageLock = fs.readFile(path.resolve(testDir, "deep_package-lock.json"))
  .then(it => JSON.parse(it));

const deepPeerPackageLock = fs.readFile(path.resolve(testDir, "deep_peer_package-lock.json"))
  .then(it => JSON.parse(it));

const localPackageLock = fs.readFile(path.resolve(testDir, "local_package-lock.json"))
  .then(it => JSON.parse(it));

describe("The package.lock parser", () => {
  describe("The parse() function", () => {

    it("accepts a string as input", async () => {
      const input = JSON.stringify(await basicPackageLock);
      expect(() => parse(input)).to.not.throw();
    });

    it("accepts a buffer as input", async () => {
      const input = Buffer.from(JSON.stringify(await basicPackageLock));
      expect(() => parse(input)).to.not.throw();
    });

    it("accepts an object as input", async () => {
      const input = await basicPackageLock;
      expect(() => parse(input)).to.not.throw();
    });

    it("returns object containing same properties as input", () => {
      const input = {
        propertyOne: "value",
        propertyTwo: "value",
        packages: { "": {} },
        dependencies: {}
      };

      const output = parse(input);

      expect(output.propertyOne).to.equal("value");
      expect(output.propertyTwo).to.equal("value");
    });

    it("returns linked dependencies", async () => {
      const PACKAGE = Symbol.for("PACKAGE");
      const MODULE = Symbol.for("MODULE");

      const input = await basicPackageLock;
      const output = parse(input);
      
      expect(output).to.not.have.property("packages");
      expect(output).to.not.have.property("devDependencies");
      expect(output).to.not.have.property("peerDependencies");

      expect(output).to.have.property("dependencies");
      const dependencies = output.dependencies;

      expect(dependencies).to.have.property("upath");
      const upath = dependencies.upath;

      expect(upath.version).to.equal(input.packages["node_modules/upath"].version);
      expect(upath[PACKAGE]).to.deep.equal(input.packages["node_modules/upath"]);
      expect(upath[MODULE]).to.deep.equal(input.dependencies.upath);
    });

    it("returns linked dependencies of dependencies", async () => {
      const input = await deepPackageLock;
      const output = parse(input);

      expect(output.dependencies).to.have.property("strip-ansi");
      const stripAnsi = output.dependencies["strip-ansi"];

      expect(stripAnsi.dependencies).to.have.property("ansi-regex");
      expect(stripAnsi.dependencies["ansi-regex"]).to.have.property("name");
    });

    it("returns linked dev-dependencies", async () => {
      const PACKAGE = Symbol.for("PACKAGE");
      const MODULE = Symbol.for("MODULE");

      const input = await basicDevPackageLock;
      const output = parse(input);
      
      expect(output).to.not.have.property("packages");
      expect(output).to.not.have.property("dependencies");
      expect(output).to.not.have.property("peerDependencies");

      expect(output).to.have.property("devDependencies");
      const dependencies = output.devDependencies;

      expect(dependencies).to.have.property("upath");
      const upath = dependencies.upath;

      expect(upath.version).to.equal(input.packages["node_modules/upath"].version);
      expect(upath[PACKAGE]).to.deep.equal(input.packages["node_modules/upath"]);
      expect(upath[MODULE]).to.deep.equal(input.dependencies.upath);
    });

    it("returns linked peer-dependencies of dependencies", async () => {
      const input = await deepPeerPackageLock;
      const output = parse(input);

      expect(output.dependencies).to.have.property("chai-as-promised");
      const chaiAsPromised = output.dependencies["chai-as-promised"];

      expect(chaiAsPromised.peerDependencies).to.have.property("chai");
      expect(chaiAsPromised.peerDependencies["chai"]).to.have.property("name");
    });

    it("returns linked local dependencies", async () => {
      const PACKAGE = Symbol.for("PACKAGE");
      const LINK = Symbol.for("LINK");

      const input = await localPackageLock;
      const output = parse(input);
      
      const exceptionsWithCause = output.dependencies["exceptions-with-cause"];
      expect(exceptionsWithCause[PACKAGE].link).to.equal(true);
      expect(exceptionsWithCause[PACKAGE][LINK]).to.deep.equal(input.packages["d:/Some/Example/Path"]);
    });

    it("throws an error when given invalid json", () => {
      expect(() => parse("not json")).to.throw("Could not parse provided package lock!");
    });

    it("throws an error when given an object without required properties", () => {
      expect(() => parse({ })).to.throw("Given object does not have required properties!");
    });

  });

  describe("The fabricate() function", () => {
    it("returns reconstructed package-lock from dependency tree", async () => {
      const packageLock = await basicPackageLock;
      const input = parse(packageLock);
      const output = fabricate(input);

      expect(output).to.deep.equal(packageLock);
    });

    it("returns deeply reconstructed package-lock from dependency tree", async () => {
      const packageLock = await deepPackageLock;
      const input = parse(packageLock);
      const output = fabricate(input);

      expect(output).to.deep.equal(packageLock);
    });

    it("returns reconstructed package-lock from dependency tree with local link dependencies", async () => {
      const packageLock = await localPackageLock;
      const input = parse(packageLock);
      const output = fabricate(input);

      expect(output).to.deep.equal(packageLock);
    });
  });
});