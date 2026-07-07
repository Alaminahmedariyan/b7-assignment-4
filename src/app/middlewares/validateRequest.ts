// export const validateRequest = (schema: z.ZodType) => {
//   return async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       if (req.body?.data) {
//         try {
//           req.body = JSON.parse(req.body.data);
//         } catch {
//           throw new Error("Invalid JSON format in request data.");
//         }
//       }

//       req.body = await schema.parseAsync(req.body);

//       next();
//     } catch (error) {
//       next(error);
//     }
//   };
// };