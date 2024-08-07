import { describe, expect, afterAll, it, jest } from "@jest/globals";
import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import * as tasks from "../src/tasks";
import "dotenv/config";

jest.mock("@cloudydaiyz/game-engine-lib");
jest.mock("mongodb");

import { TaskSubmissionConfirmation } from "@cloudydaiyz/game-engine-lib";
import { viewAllTasks, viewAllPublicTasks, viewTask, viewPublicTask, submitTask } from "@cloudydaiyz/game-engine-lib";
import { createEvent, exampleCallback, exampleContext } from "./testutils";

afterAll(async () => { 
    jest.restoreAllMocks();
});

describe("tasks handler tests", () => {
    it("should view all public tasks", async () => {
        const event = createEvent(
            { "Content-Type": "application/json" },
            "/game/123456/tasks",
            "GET",
            undefined,
            { public: "true" }
        );

        const result = await tasks.handler(event, exampleContext, exampleCallback) as APIGatewayProxyStructuredResultV2;
        expect(result.statusCode).toBe(200);
        expect(viewAllPublicTasks).toHaveBeenCalledWith("123456");
    });

    it("should view all tasks for a private game", async () => {
        const event = createEvent(
            { "Content-Type": "application/json", "token": "dummy-token" },
            "/game/123456/tasks",
            "GET",
            undefined,
            { public: "false" }
        );

        const result = await tasks.handler(event, exampleContext, exampleCallback) as APIGatewayProxyStructuredResultV2;
        expect(result.statusCode).toBe(200);
        expect(viewAllTasks).toHaveBeenCalledWith("dummy-token", "123456");
    });

    it("should view a public task", async () => {
        const event = createEvent(
            { "Content-Type": "application/json" },
            "/game/123456/tasks/789",
            "GET",
            undefined,
            { public: "true" }
        );

        const result = await tasks.handler(event, exampleContext, exampleCallback) as APIGatewayProxyStructuredResultV2;
        expect(result.statusCode).toBe(200);
        expect(viewPublicTask).toHaveBeenCalledWith("123456", "789");
    });

    it("should view a private task", async () => {
        const event = createEvent(
            { "Content-Type": "application/json", "token": "dummy-token" },
            "/game/123456/tasks/789",
            "GET",
            undefined,
            { public: "false" }
        );

        const result = await tasks.handler(event, exampleContext, exampleCallback) as APIGatewayProxyStructuredResultV2;
        expect(result.statusCode).toBe(200);
        expect(viewTask).toHaveBeenCalledWith("dummy-token", "123456", "789");
    });

    it("should submit a task", async () => {
        const event = createEvent(
            { "Content-Type": "application/json", "token": "dummy-token" },
            "/game/123456/tasks/789/submit",
            "POST",
            { answers: ["answer1", "answer2"] }
        );

        (submitTask as jest.Mock<typeof submitTask>).mockResolvedValue({} as TaskSubmissionConfirmation);

        const result = await tasks.handler(event, exampleContext, exampleCallback) as APIGatewayProxyStructuredResultV2;
        expect(result.statusCode).toBe(200);
        expect(submitTask).toHaveBeenCalledWith("dummy-token", "123456", "789", ["answer1", "answer2"]);
    });

    it("should return error for missing token on private tasks", async () => {
        const event = createEvent(
            { "Content-Type": "application/json" },
            "/game/123456/tasks",
            "GET",
            undefined,
            { public: "false" }
        );

        const result = await tasks.handler(event, exampleContext, exampleCallback) as APIGatewayProxyStructuredResultV2;
        expect(result.statusCode).toBe(400);
        expect(result.body).toBe("Must have a token for this operation");
    });

    it("should return error for missing request body on submit task", async () => {
        const event = createEvent(
            { "Content-Type": "application/json", "token": "dummy-token" },
            "/game/123456/tasks/789/submit",
            "POST"
        );

        const result = await tasks.handler(event, exampleContext, exampleCallback) as APIGatewayProxyStructuredResultV2;
        expect(result.statusCode).toBe(400);
        expect(result.body).toBe("Must have a request body");
    });

    it("should return error for invalid path", async () => {
        const event = createEvent(
            { "Content-Type": "application/json" },
            "/invalid/path",
            "GET"
        );

        const result = await tasks.handler(event, exampleContext, exampleCallback) as APIGatewayProxyStructuredResultV2;
        expect(result.statusCode).toBe(400);
        expect(result.body).toBe("Invalid path");
    });

    it("should return error for invalid method", async () => {
        const event = createEvent(
            { "Content-Type": "application/json" },
            "/game/123456/tasks",
            "PUT"
        );

        const result = await tasks.handler(event, exampleContext, exampleCallback) as APIGatewayProxyStructuredResultV2;
        expect(result.statusCode).toBe(400);
        expect(result.body).toBe("Invalid request method");
    });
});