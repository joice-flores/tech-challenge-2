import mongoose, { Document, Schema } from "mongoose";

export interface IPost extends Document {
  title: string;
  content: string;
  authorId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>({
  title: {
    type: String,
    required: [true, "Título do post é obrigatório"],
    trim: true,
  },
  content: {
    type: String,
    required: [true, "Conteúdo é obrigatório"],
  },
  authorId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "ID do autor é obrigatório"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Índice de texto para busca inteligente (ignora acentos)
PostSchema.index(
  { title: "text", content: "text" },
  {
    default_language: "portuguese",
    weights: {
      title: 10,
      content: 5,
    },
  },
);

export const Post = mongoose.model<IPost>("Post", PostSchema);
