import { getAppToken } from "@/cronos";
import { FastifyInstance } from "fastify";

export const authRoutes = async (app: FastifyInstance) => {
    app.get('/token', async (request, reply) => {

        console.log("Chamando API externa...");



        try {
            const response = await getAppToken()
            return reply.send({
                success: true,
                data: response.data
            });

        } catch (error) {
            console.error("Erro ao chamar API externa", error);
            return reply.code(500).send({
                success: false,
                message: "Erro ao chamar API externa"
            });
        }
    });
};
