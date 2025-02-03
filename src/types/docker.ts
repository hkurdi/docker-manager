interface Container {
  name?: string;
  status?: string;
  state?: string;
  ports?: string[];
}

interface Image {
  repo_tag: string;
  size: number;
}
